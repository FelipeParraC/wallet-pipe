'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
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
        
        const prismaTransactions = await withPrismaTimeout(() => (prisma as unknown as TransactionReader).transaction.findMany({
            where: {
                userId: user.id,
                OR: [
                    { walletId: id },
                    { fromWalletId: id },
                    { toWalletId: id },
                ]
            },
            include: { tags: { include: { tag: true } } },
            orderBy: {
                occurredAt: 'desc'
            }
        }), 'getTransactionsByWalletId') as PrismaTransaction[]

        const uniqueTransactions = Array.from(new Map(prismaTransactions.map((transaction) => [transaction.id, transaction])).values())
        const transactions = uniqueTransactions.map( t => mapToTransaction(t))

        return { ...actionSuccess({ transactions }), transactions }

    } catch ( error ) {
        console.error('getTransactionsByWalletId', error)
        return {
            ...asFailure(error),
            transactions: null
        }
    }

}
