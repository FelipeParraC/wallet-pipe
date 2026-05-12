'use server'

import { UpdateTransactionInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { assertProtectedTransactionAmountIsUnchanged } from '@/lib/linked-transaction-guards'
import { syncTransactionTagsInTx } from '@/lib/tag-service'
import { updateTransactionInTx } from '@/lib/transaction-service'
import { logServerActionError } from '@/lib/server-action-logging'

export const updateTransactionById = async (data: UpdateTransactionInput, id: string) => {
    try {
        const user = await requireSessionUser()

        const transaction = await prisma.$transaction(async (tx) => {
            const current = await tx.transaction.findFirst({
                where: { id, userId: user.id },
                select: {
                    amount: true,
                    type: true,
                    scheduledPlanId: true,
                    scheduledOccurrenceId: true,
                    installmentPlanId: true,
                    installmentOccurrenceId: true,
                    debtId: true,
                },
            })

            if (!current) {
                throw new Error('La transacción no existe o no pertenece al usuario')
            }

            assertProtectedTransactionAmountIsUnchanged(current, data.newAmount)

            const updated = await updateTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, id, data)
            await syncTransactionTagsInTx(tx, user.id, id, data.tagIds)
            return updated
        })

        return {
            ...actionSuccess({ transaction }, 'Transacción actualizada'),
            transaction
        }
    } catch (error) {
        logServerActionError('updateTransactionById', error)
        return asFailure(error)
    }
}
