import type { CreateWalletInput } from '../interfaces'
import { absMinorUnits, canUseFareValue, ensurePositiveMoney, isCreditCardWallet, moneyInputToMinorUnits, roundMoney } from './finance'
import { mapToCreatePrismaWallet, mapToPrismaTransactionType } from '../utils'

export interface WalletServiceTx {
  wallet: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string, createdAt: Date }>
  }
  transaction: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}

export const createWalletInTx = async (tx: WalletServiceTx, userId: string, data: CreateWalletInput) => {
  if (data.balance < 0) {
    throw new Error('El saldo inicial no puede ser negativo')
  }

  if (canUseFareValue(data.type)) {
    ensurePositiveMoney(data.fareValue ?? 0, 'El valor del pasaje')
  }

  const walletData = mapToCreatePrismaWallet(
    {
      ...data,
      balance: roundMoney(data.balance),
      fareValue: data.fareValue ? roundMoney(data.fareValue) : undefined,
    },
    userId
  )

  const wallet = await tx.wallet.create({ data: walletData })

  if (data.balance > 0) {
    const initialAmountInMinorUnits = moneyInputToMinorUnits(data.balance)

    await tx.transaction.create({
      data: {
        userId,
        title: 'Saldo inicial',
        description: 'Saldo inicial de la billetera',
        type: mapToPrismaTransactionType(isCreditCardWallet(data.type) ? 'TARJETA_CONSUMO' : 'INGRESO'),
        walletId: wallet.id,
        occurredAt: wallet.createdAt,
        recordedAt: wallet.createdAt,
        categoryId: null,
        amount: isCreditCardWallet(data.type) ? -absMinorUnits(initialAmountInMinorUnits) : initialAmountInMinorUnits,
        isVisible: false,
      }
    })
  }

  return wallet
}
