'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { deleteTransactionInTx } from '@/lib/transaction-service'

export const deleteTransactionById = async (id: string) => {
    try {
        const user = await requireSessionUser()

        await prisma.$transaction(async (tx) => {
            await deleteTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, id)
        })

        return actionSuccess(undefined, 'Transacción eliminada')
    } catch (error) {
        console.error('deleteTransactionById', error)
        return asFailure(error)
    }
}
