'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { deleteTransactionInTx } from '@/lib/transaction-service'
import { absMinorUnits, addMinorUnits, moneyToMinorUnits } from '@/lib/finance'

const updateCreditCardState = async (
    tx: Prisma.TransactionClient,
    walletId: string,
    nextDebt: bigint,
) => {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } })
    if (!wallet) throw new Error('La tarjeta no existe')

    const creditLimit = moneyToMinorUnits(wallet.creditLimit ?? 0)

    await tx.wallet.update({
        where: { id: wallet.id },
        data: {
            balance: nextDebt,
            availableCredit: creditLimit > BigInt(0) ? creditLimit - nextDebt : undefined,
        },
    })
}

export const deleteTransactionById = async (id: string) => {
    try {
        const user = await requireSessionUser()

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findFirst({
                where: { id, userId: user.id },
                include: {
                    installmentPlan: {
                        include: {
                            occurrences: true,
                        },
                    },
                },
            })

            if (!transaction) {
                throw new Error('La transacción no existe o no pertenece al usuario')
            }

            if (transaction.type === 'TARJETA_CONSUMO' && transaction.installmentPlan) {
                const hasRealInstallmentPayments = transaction.installmentPlan.occurrences.some((occurrence) => (
                    occurrence.status === 'EJECUTADA' && Boolean(occurrence.linkedTransactionId)
                ))

                if (hasRealInstallmentPayments) {
                    throw new Error('No puedes borrar una compra a cuotas con pagos reales vinculados. Borra o reabre esos pagos primero.')
                }

                const importedPaidAmount = transaction.installmentPlan.occurrences
                    .filter((occurrence) => occurrence.status === 'EJECUTADA' && !occurrence.linkedTransactionId)
                    .reduce((sum, occurrence) => addMinorUnits(sum, moneyToMinorUnits(occurrence.expectedAmount)), BigInt(0))

                if (importedPaidAmount > BigInt(0)) {
                    const creditWallet = await tx.wallet.findUnique({ where: { id: transaction.walletId } })
                    if (!creditWallet) throw new Error('La tarjeta asociada no existe')

                    await updateCreditCardState(
                        tx,
                        creditWallet.id,
                        addMinorUnits(moneyToMinorUnits(creditWallet.balance), importedPaidAmount),
                    )
                }
            }

            await deleteTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, id)

            if (transaction.scheduledOccurrenceId) {
                await tx.scheduledOccurrence.update({
                    where: { id: transaction.scheduledOccurrenceId },
                    data: {
                        status: 'PENDIENTE',
                        linkedTransactionId: null,
                        expectedAmount: absMinorUnits(moneyToMinorUnits(transaction.amount)),
                    },
                })
            }

            if (transaction.installmentOccurrenceId) {
                const occurrence = await tx.installmentOccurrence.update({
                    where: { id: transaction.installmentOccurrenceId },
                    data: {
                        status: 'PENDIENTE',
                        linkedTransactionId: null,
                        expectedAmount: absMinorUnits(moneyToMinorUnits(transaction.amount)),
                    },
                })
                const pendingCount = await tx.installmentOccurrence.count({
                    where: { installmentPlanId: occurrence.installmentPlanId, status: 'PENDIENTE' },
                })

                await tx.installmentPlan.update({
                    where: { id: occurrence.installmentPlanId },
                    data: {
                        remainingInstallments: pendingCount,
                        isActive: pendingCount > 0,
                    },
                })
            }

            if (transaction.debtId && (transaction.type === 'DEUDA_ABONO' || transaction.type === 'INGRESO')) {
                const debt = await tx.debt.findFirst({ where: { id: transaction.debtId, userId: user.id } })
                if (debt) {
                    await tx.debt.update({
                        where: { id: debt.id },
                        data: {
                            currentBalance: addMinorUnits(moneyToMinorUnits(debt.currentBalance), absMinorUnits(moneyToMinorUnits(transaction.amount))),
                            status: 'ACTIVA',
                            settledAt: null,
                        },
                    })
                }
            }

            if (transaction.type === 'TARJETA_CONSUMO' && transaction.installmentPlan) {
                await tx.installmentPlan.delete({ where: { id: transaction.installmentPlan.id } })
            }
        })

        revalidatePath('/')
        revalidatePath('/transacciones')
        revalidatePath('/billeteras')
        revalidatePath('/planeacion')
        revalidatePath('/reportes')

        return actionSuccess(undefined, 'Transacción eliminada')
    } catch (error) {
        console.error('deleteTransactionById', error)
        return asFailure(error)
    }
}
