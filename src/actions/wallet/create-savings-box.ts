'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyInputToMinorUnits } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createTransactionInTx } from '@/lib/transaction-service'
import { logServerActionError } from '@/lib/server-action-logging'

interface CreateSavingsBoxInput {
  parentWalletId: string
  name: string
  balance: number
  color: string
  includeInTotal: boolean
}

export const createSavingsBox = async (data: CreateSavingsBoxInput) => {
  try {
    const user = await requireSessionUser()
    const name = data.name.trim()
    if (!name) throw new Error('El nombre de la cajita es requerido')
    if (data.balance < 0) throw new Error('El saldo inicial no puede ser negativo')

    const wallet = await prisma.$transaction(async (tx) => {
      const parentWallet = await tx.wallet.findFirst({
        where: { id: data.parentWalletId, userId: user.id, isActive: true },
      })

      if (!parentWallet) throw new Error('La cuenta padre no existe o está inactiva')
      if (parentWallet.type === 'TARJETA_CREDITO' || parentWallet.type === 'TRANSPORTE' || parentWallet.isSavingsBox) {
        throw new Error('Las cajitas solo se pueden crear dentro de cuentas normales')
      }

      const initialAmount = moneyInputToMinorUnits(data.balance)
      if (initialAmount > parentWallet.balance) {
        throw new Error('El saldo inicial de la cajita no puede superar el saldo de la cuenta padre')
      }

      const savingsBox = await tx.wallet.create({
        data: {
          userId: user.id,
          parentWalletId: parentWallet.id,
          name,
          balance: BigInt(0),
          type: parentWallet.type,
          color: data.color,
          includeInTotal: data.includeInTotal,
          isSavingsBox: true,
        },
      })

      if (data.balance > 0) {
        await createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, {
          walletId: parentWallet.id,
          type: 'TRANSFERENCIA',
          title: `Apertura cajita: ${name}`,
          description: 'Movimiento inicial hacia cajita',
          date: Date.now(),
          recordedAt: Date.now(),
          amount: -data.balance,
          fromWalletId: parentWallet.id,
          toWalletId: savingsBox.id,
        })
      }

      return savingsBox
    })

    revalidatePath('/billeteras')
    revalidatePath(`/billeteras/${data.parentWalletId}`)
    revalidatePath(`/billeteras/${data.parentWalletId}/cajitas`)

    return actionSuccess({ wallet }, 'Cajita creada')
  } catch (error) {
    logServerActionError('createSavingsBox', error)
    return asFailure(error)
  }
}
