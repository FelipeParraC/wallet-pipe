'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyInputToMinorUnits } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createTransactionInTx } from '@/lib/transaction-service'
import { logServerActionError } from '@/lib/server-action-logging'

interface MoveSavingsBoxMoneyInput {
  savingsBoxId: string
  direction: 'ADD' | 'WITHDRAW'
  amount: number
}

export const moveSavingsBoxMoney = async (data: MoveSavingsBoxMoneyInput) => {
  try {
    const user = await requireSessionUser()
    let parentWalletId: string | null = null
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0')
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const savingsBox = await tx.wallet.findFirst({
        where: { id: data.savingsBoxId, userId: user.id, isActive: true, isSavingsBox: true },
      })

      if (!savingsBox || !savingsBox.parentWalletId) {
        throw new Error('La cajita no existe o no está asociada a una cuenta')
      }

      const parentWallet = await tx.wallet.findFirst({
        where: { id: savingsBox.parentWalletId, userId: user.id, isActive: true },
      })

      if (!parentWallet || parentWallet.isSavingsBox || parentWallet.type === 'TARJETA_CREDITO' || parentWallet.type === 'TRANSPORTE') {
        throw new Error('La cuenta padre de la cajita no está disponible')
      }
      parentWalletId = parentWallet.id

      const amountInMinorUnits = moneyInputToMinorUnits(data.amount)

      if (data.direction === 'ADD' && amountInMinorUnits > parentWallet.balance) {
        throw new Error('No puedes agregar más dinero del que tiene la cuenta padre')
      }

      if (data.direction === 'WITHDRAW' && amountInMinorUnits > savingsBox.balance) {
        throw new Error('No puedes sacar más dinero del que tiene la cajita')
      }

      const isAdding = data.direction === 'ADD'
      const fromWalletId = isAdding ? parentWallet.id : savingsBox.id
      const toWalletId = isAdding ? savingsBox.id : parentWallet.id
      const title = isAdding ? `Agregar a cajita: ${savingsBox.name}` : `Sacar de cajita: ${savingsBox.name}`

      return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, {
        walletId: fromWalletId,
        type: 'TRANSFERENCIA',
        title,
        description: 'Movimiento interno de cajita',
        date: Date.now(),
        recordedAt: Date.now(),
        amount: -data.amount,
        fromWalletId,
        toWalletId,
      })
    })

    revalidatePath('/billeteras')
    revalidatePath(`/billeteras/${data.savingsBoxId}`)
    if (parentWalletId) {
      revalidatePath(`/billeteras/${parentWalletId}`)
      revalidatePath(`/billeteras/${parentWalletId}/cajitas`)
    }

    return actionSuccess({ transaction }, 'Movimiento interno registrado')
  } catch (error) {
    logServerActionError('moveSavingsBoxMoney', error)
    return asFailure(error)
  }
}
