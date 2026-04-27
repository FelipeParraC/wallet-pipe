'use server'

import { CreateTransactionInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createTransactionInTx } from '@/lib/transaction-service'

export const createTransaction = async (data: CreateTransactionInput) => {
    try {
        const user = await requireSessionUser()

        const transaction = await prisma.$transaction(async (tx) => {
            return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, data)
        })

        return {
            ...actionSuccess({ transaction }, 'Transacción creada'),
            transaction
        }
    } catch (error) {
        console.error('createTransaction', error)
        return asFailure(error)
    }
}
