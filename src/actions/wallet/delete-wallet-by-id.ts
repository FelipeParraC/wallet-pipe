'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, ensureOwnedWallet, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

export const deleteWalletById = async (id: string) => {
    try {
        const user = await requireSessionUser()
        let wasArchived = false

        await prisma.$transaction(async (tx) => {
            const walletToDelete = await ensureOwnedWallet(tx, id, user.id)

            const transferTransaction = await tx.transaction.findFirst({
                where: { userId: user.id, OR: [{ fromWalletId: id }, { toWalletId: id }] }
            })
            const directTransaction = await tx.transaction.findFirst({
                where: { userId: user.id, walletId: id }
            })
            const installmentPlans = walletToDelete.type === 'TARJETA_CREDITO'
                ? await tx.installmentPlan.findMany({
                    where: { userId: user.id, chargeWalletId: id },
                    select: { id: true },
                })
                : []
            const shouldArchiveCreditCard = walletToDelete.type === 'TARJETA_CREDITO' && (
                Boolean(transferTransaction)
                || Boolean(directTransaction)
                || installmentPlans.length > 0
            )

            if (shouldArchiveCreditCard) {
                const planIds = installmentPlans.map((plan) => plan.id)

                if (planIds.length > 0) {
                    await tx.installmentOccurrence.updateMany({
                        where: {
                            userId: user.id,
                            installmentPlanId: { in: planIds },
                            status: { in: ['PENDIENTE', 'OMITIDA'] },
                        },
                        data: { status: 'CANCELADA' },
                    })

                    await tx.installmentPlan.updateMany({
                        where: { userId: user.id, id: { in: planIds } },
                        data: {
                            isActive: false,
                            remainingInstallments: 0,
                            paymentWalletId: null,
                        },
                    })
                }

                await tx.wallet.update({
                    where: { id },
                    data: {
                        balance: 0,
                        availableCredit: walletToDelete.creditLimit ?? 0,
                        includeInTotal: false,
                        isActive: false,
                    }
                })

                wasArchived = true
                return
            }

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

        revalidatePath('/billeteras')
        revalidatePath('/planeacion')
        revalidatePath('/reportes')
        revalidatePath('/')

        return actionSuccess(undefined, wasArchived ? 'Tarjeta archivada y cuotas pendientes canceladas' : 'Billetera eliminada')
    } catch (error) {
        logServerActionError('deleteWalletById', error)
        return asFailure(error)
    }
}
