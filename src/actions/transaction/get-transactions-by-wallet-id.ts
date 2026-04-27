'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import type { PrismaTransaction } from '@/interfaces'

type TransactionReader = {
    transaction: {
        findMany: (args: unknown) => Promise<PrismaTransaction[]>
    }
}

export const getTransactionsByWalletId = async ( id: string ) => {
    try {
        const user = await requireSessionUser()
        
        const prismaTransactions = await (prisma as unknown as TransactionReader).transaction.findMany({
            where: {
                userId: user.id,
                OR: [
                    { walletId: id },
                    { toWalletId: id },
                ]
            },
            orderBy: {
                occurredAt: 'desc'
            }
        }) as PrismaTransaction[]

        const transactions = prismaTransactions.map( t => mapToTransaction(t))

        return { ...actionSuccess({ transactions }), transactions }

    } catch ( error ) {
        console.error('getTransactionsByWalletId', error)
        return {
            ...asFailure(error),
            transactions: null
        }
    }

}
