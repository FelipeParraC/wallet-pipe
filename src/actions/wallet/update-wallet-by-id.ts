'use server'

import { UpdateWalletInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToUpdatePrismaWallet } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { canUseFareValue, ensurePositiveMoney, isCreditCardWallet, roundMoney } from '@/lib/finance'
import { asFailure, ensureOwnedWallet, requireSessionUser } from '@/lib/server-validation'

export const updateWalletById = async (data: UpdateWalletInput, id: string) => {
    try {
        const user = await requireSessionUser()

        const wallet = await prisma.$transaction( async(tx) => {
            const walletToUpdate = await ensureOwnedWallet(tx, id, user.id)

            if (canUseFareValue(walletToUpdate.type) && data.fareValue !== undefined) {
                ensurePositiveMoney(data.fareValue, 'El valor del pasaje')
            }

            if (isCreditCardWallet(walletToUpdate.type)) {
                if (data.creditLimit !== undefined) {
                    ensurePositiveMoney(data.creditLimit, 'El cupo de la tarjeta')
                }

                if (
                    data.statementClosingDay !== undefined &&
                    (data.statementClosingDay < 1 || data.statementClosingDay > 31)
                ) {
                    throw new Error('El día de corte debe estar entre 1 y 31')
                }

                if (
                    data.paymentDueDay !== undefined &&
                    (data.paymentDueDay < 1 || data.paymentDueDay > 31)
                ) {
                    throw new Error('El día límite de pago debe estar entre 1 y 31')
                }
            }

            const walletData = mapToUpdatePrismaWallet({
                ...data,
                fareValue: data.fareValue !== undefined ? roundMoney(data.fareValue) : undefined,
                creditLimit: data.creditLimit !== undefined ? roundMoney(data.creditLimit) : undefined,
                availableCredit: data.availableCredit !== undefined ? roundMoney(data.availableCredit) : undefined,
            })

            return tx.wallet.update({
                where: { id: id },
                data: walletData,
            })
        })

        return {
            ...actionSuccess({ wallet }, 'Billetera actualizada'),
            wallet
        }
    } catch (error) {
        console.error('updateWalletById', error)
        return asFailure(error)
    }
}
