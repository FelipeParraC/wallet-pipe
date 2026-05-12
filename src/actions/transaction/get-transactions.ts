'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import type { PrismaTransaction } from '@/interfaces'
import { logServerActionError } from '@/lib/server-action-logging'

type TransactionReader = {
    transaction: {
        findMany: (args: unknown) => Promise<PrismaTransaction[]>
    }
}

export const getTransactions = async () => {
    try {
        const user = await requireSessionUser()

        const prismaTransactions = await withPrismaTimeout(() => (prisma as unknown as TransactionReader).transaction.findMany({
            where: { userId: user.id },
            include: { tags: { include: { tag: true } } },
            orderBy: {
                occurredAt: 'desc'
            }
        }), 'getTransactions') as PrismaTransaction[]

        const transactions = prismaTransactions.map(t => mapToTransaction(t))

        return { ...actionSuccess({ transactions }), transactions }

    } catch (error) {
        logServerActionError('getTransactions', error)
        return {
            ...asFailure(error),
            transactions: null
        }
    }

}
