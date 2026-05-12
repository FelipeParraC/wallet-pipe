'use server'

import type { CreateWalletInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { canUseFareValue, ensurePositiveMoney, isCreditCardWallet, roundMoney } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createWalletInTx } from '@/lib/wallet-service'
import { logServerActionError } from '@/lib/server-action-logging'

export const createWallet = async (data: CreateWalletInput) => {
    try {
        const user = await requireSessionUser()

        if (canUseFareValue(data.type) && data.fareValue !== undefined) {
            ensurePositiveMoney(data.fareValue, 'El valor del pasaje')
        }

        if (isCreditCardWallet(data.type)) {
            if (data.creditLimit === undefined) {
                throw new Error('El cupo de la tarjeta es requerido')
            }

            ensurePositiveMoney(data.creditLimit, 'El cupo de la tarjeta')

            if (!data.statementClosingDay || data.statementClosingDay < 1 || data.statementClosingDay > 31) {
                throw new Error('El día de corte debe estar entre 1 y 31')
            }

            if (!data.paymentDueDay || data.paymentDueDay < 1 || data.paymentDueDay > 31) {
                throw new Error('El día límite de pago debe estar entre 1 y 31')
            }
        }

        const wallet = await prisma.$transaction( async(tx) => {
            return createWalletInTx(tx as unknown as import('@/lib/wallet-service').WalletServiceTx, user.id, {
                ...data,
                fareValue: data.fareValue !== undefined ? roundMoney(data.fareValue) : undefined,
                creditLimit: data.creditLimit !== undefined ? roundMoney(data.creditLimit) : undefined,
                availableCredit: data.availableCredit !== undefined ? roundMoney(data.availableCredit) : undefined,
            })
        })

        return {
            ...actionSuccess({ wallet }),
            wallet
        }
    } catch (error) {
        logServerActionError('createWallet', error)
        return asFailure(error)
    }

}
