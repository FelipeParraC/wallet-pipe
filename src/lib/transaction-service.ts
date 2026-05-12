import { CreateTransactionInput, UpdateTransactionInput } from '../interfaces'
import { absMinorUnits, addMinorUnits, ensurePositiveMoney, ensureValidTimestamp, isCreditCardWallet, isTransferType, moneyInputToMinorUnits, moneyToMinorUnits, roundMoney, toSignedAmount, toTransferAmount, updateWalletBalance } from './finance'
import { mapToCreatePrismaTransaction, mapToUpdatePrismaTransaction } from '../utils'

interface ServiceWallet {
  id: string
  userId: string
  balance: bigint | number | { toNumber(): number }
  isActive: boolean
  type?: string
  creditLimit?: bigint | number | { toNumber(): number } | null
  availableCredit?: bigint | number | { toNumber(): number } | null
}

interface ServiceTransaction {
  id: string
  userId: string
  walletId: string
  type: string
  amount: bigint | number | { toNumber(): number }
  fromWalletId?: string | null
  toWalletId?: string | null
}

interface ServiceCategory {
  id: string
}

export interface TransactionServiceTx {
  wallet: {
    findUnique: (args: { where: { id: string } }) => Promise<ServiceWallet | null>
    update: (args: { where: { id: string }, data: Record<string, unknown> }) => Promise<unknown>
  }
  transaction: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
    findFirst: (args: { where: Record<string, unknown> }) => Promise<ServiceTransaction | null>
    update: (args: { where: { id: string }, data: Record<string, unknown> }) => Promise<unknown>
    delete: (args: { where: { id: string } }) => Promise<unknown>
  }
  category: {
    findUnique: (args: { where: { id: string } }) => Promise<ServiceCategory | null>
  }
}

const ensureOwnedWalletInTx = async (
  tx: TransactionServiceTx,
  walletId: string,
  userId: string,
  options?: { allowInactive?: boolean },
) => {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } })

  if (!wallet || wallet.userId !== userId) {
    throw new Error('La billetera no existe o no pertenece al usuario')
  }

  if (!options?.allowInactive && !wallet.isActive) {
    throw new Error('La billetera seleccionada está inactiva')
  }

  return wallet
}

const ensureCategoryExistsInTx = async (tx: TransactionServiceTx, categoryId?: string | null) => {
  if (!categoryId) return

  const category = await tx.category.findUnique({ where: { id: categoryId } })

  if (!category) {
    throw new Error('La categoría seleccionada no existe')
  }
}

const updateCreditCardState = async (tx: TransactionServiceTx, wallet: ServiceWallet, nextDebt: bigint) => {
  const creditLimit = moneyToMinorUnits(wallet.creditLimit ?? 0)
  const nextAvailableCredit = creditLimit > BigInt(0) ? addMinorUnits(creditLimit, -nextDebt) : undefined

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: nextDebt,
      availableCredit: nextAvailableCredit
    }
  })
}

export const createTransactionInTx = async (tx: TransactionServiceTx, userId: string, data: CreateTransactionInput) => {
  ensureValidTimestamp(data.date)
  await ensureCategoryExistsInTx(tx, data.categoryId)

  if (isTransferType(data.type)) {
    if (!data.fromWalletId || !data.toWalletId) {
      throw new Error('La transferencia requiere billetera de origen y de destino')
    }

    if (data.fromWalletId === data.toWalletId) {
      throw new Error('La transferencia debe hacerse entre billeteras diferentes')
    }

    ensurePositiveMoney(Math.abs(data.amount), 'El monto de la transferencia')

    const fromWallet = await ensureOwnedWalletInTx(tx, data.fromWalletId, userId)
    const toWallet = await ensureOwnedWalletInTx(tx, data.toWalletId, userId)
    const transferAmount = toTransferAmount(data.amount)

    await tx.wallet.update({
      where: { id: fromWallet.id },
      data: { balance: updateWalletBalance(fromWallet, transferAmount) }
    })

    await tx.wallet.update({
      where: { id: toWallet.id },
      data: { balance: updateWalletBalance(toWallet, Math.abs(transferAmount)) }
    })

    return tx.transaction.create({
      data: mapToCreatePrismaTransaction({
        ...data,
        amount: transferAmount,
        walletId: fromWallet.id,
      }, userId)
    })
  }

  const wallet = await ensureOwnedWalletInTx(tx, data.walletId, userId)
  const normalizedAmount = roundMoney(data.amount)
  const normalizedAmountInMinorUnits = moneyInputToMinorUnits(normalizedAmount)
  ensurePositiveMoney(Math.abs(normalizedAmount), data.type === 'TRANSPORTE' ? 'El monto del transporte' : 'El monto de la transacción')

  if (data.type === 'TARJETA_CONSUMO') {
    if (!isCreditCardWallet(wallet.type ?? '')) {
      throw new Error('Los consumos de tarjeta deben registrarse sobre una tarjeta de crédito')
    }

    await updateCreditCardState(tx, wallet, updateWalletBalance(wallet, absMinorUnits(normalizedAmountInMinorUnits)))

    return tx.transaction.create({
      data: mapToCreatePrismaTransaction({
        ...data,
        amount: -normalizedAmount,
        walletId: wallet.id,
      }, userId)
    })
  }

  if (data.type === 'TARJETA_DEVOLUCION') {
    if (!isCreditCardWallet(wallet.type ?? '')) {
      throw new Error('Las devoluciones de tarjeta deben registrarse sobre una tarjeta de crédito')
    }

    await updateCreditCardState(tx, wallet, updateWalletBalance(wallet, -absMinorUnits(normalizedAmountInMinorUnits)))

    return tx.transaction.create({
      data: mapToCreatePrismaTransaction({
        ...data,
        amount: Math.abs(normalizedAmount),
        walletId: wallet.id,
      }, userId)
    })
  }

  if (data.type === 'PAGO_TARJETA') {
    if (!data.fromWalletId || !data.toWalletId) {
      throw new Error('El pago de tarjeta requiere cuenta de origen y tarjeta de destino')
    }

    const sourceWallet = await ensureOwnedWalletInTx(tx, data.fromWalletId, userId)
    const creditWallet = await ensureOwnedWalletInTx(tx, data.toWalletId, userId)

    if (!isCreditCardWallet(creditWallet.type ?? '')) {
      throw new Error('La billetera destino debe ser una tarjeta de crédito')
    }

    const paymentAmount = toTransferAmount(data.amount)

    await tx.wallet.update({
      where: { id: sourceWallet.id },
      data: { balance: updateWalletBalance(sourceWallet, paymentAmount) }
    })

    await updateCreditCardState(tx, creditWallet, updateWalletBalance(creditWallet, -absMinorUnits(moneyInputToMinorUnits(paymentAmount))))

    return tx.transaction.create({
      data: mapToCreatePrismaTransaction({
        ...data,
        amount: paymentAmount,
        walletId: sourceWallet.id,
      }, userId)
    })
  }

  await tx.wallet.update({
    where: { id: wallet.id },
      data: { balance: updateWalletBalance(wallet, moneyInputToMinorUnits(normalizedAmount)) }
  })

  return tx.transaction.create({
    data: mapToCreatePrismaTransaction({
      ...data,
      amount: toSignedAmount(data.type, normalizedAmount),
      walletId: wallet.id,
    }, userId)
  })
}

export const updateTransactionInTx = async (tx: TransactionServiceTx, userId: string, id: string, data: UpdateTransactionInput) => {
  ensureValidTimestamp(data.date)

  const transactionToUpdate = await tx.transaction.findFirst({ where: { id } })

  if (!transactionToUpdate || transactionToUpdate.userId !== userId) {
    throw new Error('La transacción no existe o no pertenece al usuario')
  }

  await ensureCategoryExistsInTx(tx, data.categoryId)

  if (isTransferType(transactionToUpdate.type)) {
    if (!transactionToUpdate.fromWalletId || !transactionToUpdate.toWalletId) {
      throw new Error('La transferencia está incompleta')
    }

    ensurePositiveMoney(Math.abs(data.newAmount), 'El monto de la transferencia')

    const fromWallet = await ensureOwnedWalletInTx(tx, transactionToUpdate.fromWalletId, userId, { allowInactive: true })
    const toWallet = await ensureOwnedWalletInTx(tx, transactionToUpdate.toWalletId, userId, { allowInactive: true })
    const previousAmount = roundMoney(Number(moneyToMinorUnits(transactionToUpdate.amount)) / 100)
    const nextAmount = -roundMoney(Math.abs(data.newAmount))

    await tx.wallet.update({
      where: { id: fromWallet.id },
      data: { balance: updateWalletBalance(fromWallet, addMinorUnits(absMinorUnits(moneyInputToMinorUnits(previousAmount)), moneyInputToMinorUnits(nextAmount))) }
    })

    await tx.wallet.update({
      where: { id: toWallet.id },
      data: { balance: updateWalletBalance(toWallet, addMinorUnits(moneyInputToMinorUnits(previousAmount), absMinorUnits(moneyInputToMinorUnits(nextAmount)))) }
    })

    return tx.transaction.update({
      where: { id },
      data: mapToUpdatePrismaTransaction({
        ...data,
        amount: previousAmount,
        newAmount: nextAmount,
      })
    })
  }

  const wallet = await ensureOwnedWalletInTx(tx, transactionToUpdate.walletId, userId, { allowInactive: true })
  const previousAmount = roundMoney(Number(moneyToMinorUnits(transactionToUpdate.amount)) / 100)
  const nextAmount = roundMoney(data.newAmount)

  if (transactionToUpdate.type === 'TARJETA_CONSUMO') {
    if (!isCreditCardWallet(wallet.type ?? '')) {
      throw new Error('El consumo existente no está asociado a una tarjeta de crédito')
    }

    const nextDebt = updateWalletBalance(wallet, addMinorUnits(absMinorUnits(moneyInputToMinorUnits(previousAmount)), -absMinorUnits(moneyInputToMinorUnits(nextAmount))))
    await updateCreditCardState(tx, wallet, nextDebt)

    return tx.transaction.update({
      where: { id },
      data: mapToUpdatePrismaTransaction({
        ...data,
        amount: previousAmount,
        newAmount: -Math.abs(nextAmount),
      })
    })
  }

  if (transactionToUpdate.type === 'TARJETA_DEVOLUCION') {
    if (!isCreditCardWallet(wallet.type ?? '')) {
      throw new Error('La devolución existente no está asociada a una tarjeta de crédito')
    }

    const nextDebt = updateWalletBalance(wallet, addMinorUnits(-absMinorUnits(moneyInputToMinorUnits(previousAmount)), absMinorUnits(moneyInputToMinorUnits(nextAmount))))
    await updateCreditCardState(tx, wallet, nextDebt)

    return tx.transaction.update({
      where: { id },
      data: mapToUpdatePrismaTransaction({
        ...data,
        amount: previousAmount,
        newAmount: Math.abs(nextAmount),
      })
    })
  }

  if (transactionToUpdate.type === 'PAGO_TARJETA') {
    if (!transactionToUpdate.fromWalletId || !transactionToUpdate.toWalletId) {
      throw new Error('El pago de tarjeta está incompleto')
    }

    const sourceWallet = await ensureOwnedWalletInTx(tx, transactionToUpdate.fromWalletId, userId, { allowInactive: true })
    const creditWallet = await ensureOwnedWalletInTx(tx, transactionToUpdate.toWalletId, userId, { allowInactive: true })
    const normalizedPreviousAmount = -Math.abs(previousAmount)
    const normalizedNextAmount = -Math.abs(nextAmount)

    await tx.wallet.update({
      where: { id: sourceWallet.id },
      data: { balance: updateWalletBalance(sourceWallet, addMinorUnits(-moneyInputToMinorUnits(normalizedPreviousAmount), moneyInputToMinorUnits(normalizedNextAmount))) }
    })

    await updateCreditCardState(tx, creditWallet, updateWalletBalance(creditWallet, addMinorUnits(
      absMinorUnits(moneyInputToMinorUnits(normalizedPreviousAmount)),
      -absMinorUnits(moneyInputToMinorUnits(normalizedNextAmount)),
    )))

    return tx.transaction.update({
      where: { id },
      data: mapToUpdatePrismaTransaction({
        ...data,
        amount: normalizedPreviousAmount,
        newAmount: normalizedNextAmount,
      })
    })
  }

  await tx.wallet.update({
    where: { id: wallet.id },
      data: { balance: updateWalletBalance(wallet, addMinorUnits(-moneyInputToMinorUnits(previousAmount), moneyInputToMinorUnits(nextAmount))) }
  })

  return tx.transaction.update({
    where: { id },
    data: mapToUpdatePrismaTransaction({
      ...data,
      amount: previousAmount,
      newAmount: nextAmount,
    })
  })
}

export const deleteTransactionInTx = async (tx: TransactionServiceTx, userId: string, id: string) => {
  const transactionToDelete = await tx.transaction.findFirst({ where: { id } })

  if (!transactionToDelete || transactionToDelete.userId !== userId) {
    throw new Error('La transacción no existe o no pertenece al usuario')
  }

  if (transactionToDelete.type === 'TARJETA_CONSUMO') {
    const creditWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.walletId, userId, { allowInactive: true })
    await updateCreditCardState(tx, creditWallet, updateWalletBalance(creditWallet, -absMinorUnits(moneyToMinorUnits(transactionToDelete.amount))))
    return tx.transaction.delete({ where: { id } })
  }

  if (transactionToDelete.type === 'TARJETA_DEVOLUCION') {
    const creditWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.walletId, userId, { allowInactive: true })
    await updateCreditCardState(tx, creditWallet, updateWalletBalance(creditWallet, absMinorUnits(moneyToMinorUnits(transactionToDelete.amount))))
    return tx.transaction.delete({ where: { id } })
  }

  if (transactionToDelete.type === 'PAGO_TARJETA') {
    if (!transactionToDelete.fromWalletId || !transactionToDelete.toWalletId) {
      throw new Error('El pago de tarjeta está incompleto')
    }

    const sourceWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.fromWalletId, userId, { allowInactive: true })
    const creditWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.toWalletId, userId, { allowInactive: true })
    const amount = moneyToMinorUnits(transactionToDelete.amount)

    await tx.wallet.update({
      where: { id: sourceWallet.id },
      data: { balance: updateWalletBalance(sourceWallet, -amount) }
    })

    await updateCreditCardState(tx, creditWallet, updateWalletBalance(creditWallet, absMinorUnits(amount)))

    return tx.transaction.delete({ where: { id } })
  }

  if (transactionToDelete.type !== 'TRANSFERENCIA') {
    const wallet = await ensureOwnedWalletInTx(tx, transactionToDelete.walletId, userId, { allowInactive: true })

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: updateWalletBalance(wallet, -moneyToMinorUnits(transactionToDelete.amount)) }
    })

    return tx.transaction.delete({ where: { id } })
  }

  if (!transactionToDelete.fromWalletId || !transactionToDelete.toWalletId) {
    throw new Error('La transferencia está incompleta')
  }

  const fromWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.fromWalletId, userId, { allowInactive: true })
  const toWallet = await ensureOwnedWalletInTx(tx, transactionToDelete.toWalletId, userId, { allowInactive: true })
  const amount = moneyToMinorUnits(transactionToDelete.amount)

  await tx.wallet.update({
    where: { id: fromWallet.id },
    data: { balance: updateWalletBalance(fromWallet, absMinorUnits(amount)) }
  })

  await tx.wallet.update({
    where: { id: toWallet.id },
    data: { balance: updateWalletBalance(toWallet, amount) }
  })

  return tx.transaction.delete({ where: { id } })
}
