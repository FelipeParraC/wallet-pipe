'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, ensureOwnedWallet, requireSessionUser } from '@/lib/server-validation'

export const deleteWalletById = async (id: string) => {
    try {
        const user = await requireSessionUser()

        await prisma.$transaction(async (tx) => {
            const walletToDelete = await ensureOwnedWallet(tx, id, user.id)

            const transferTransaction = await tx.transaction.findFirst({
                where: { userId: user.id, OR: [{ fromWalletId: id }, { toWalletId: id }] }
            })

            await tx.transaction.deleteMany({
                where: {
                    userId: user.id,
                    walletId: id,
                    OR: [
                        { fromWalletId: { not: id } },
                        { fromWalletId: null }
                    ]
                }
            })

            if (!transferTransaction) {
                await tx.wallet.delete({ where: { id } })
            } else {
                await tx.wallet.update({
                    where: { id },
                    data: {
                        balance: 0,
                        fareValue: walletToDelete.fareValue ? 0 : undefined,
                        includeInTotal: false,
                        isActive: false
                    }
                })
            }
        })

        return actionSuccess(undefined, 'Billetera eliminada')
    } catch (error) {
        console.error('deleteWalletById', error)
        return asFailure(error)
    }
}
