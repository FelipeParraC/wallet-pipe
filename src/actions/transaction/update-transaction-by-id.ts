'use server'

import { UpdateTransactionInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { updateTransactionInTx } from '@/lib/transaction-service'

export const updateTransactionById = async (data: UpdateTransactionInput, id: string) => {
    try {
        const user = await requireSessionUser()

        const transaction = await prisma.$transaction(async (tx) => {
            return updateTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, id, data)
        })

        return {
            ...actionSuccess({ transaction }, 'Transacción actualizada'),
            transaction
        }
    } catch (error) {
        console.error('updateTransactionById', error)
        return asFailure(error)
    }
}
