'use server'

import prisma from '@/lib/prisma'
import { mapToCategory } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import type { PrismaCategory } from '@/interfaces'

type CategoryReader = {
    category: {
        findMany: (args: unknown) => Promise<PrismaCategory[]>
    }
}


export const getCategories = async () => {
    try {
        const user = await requireSessionUser()
        const prismaClient = prisma as unknown as CategoryReader
        
        const prismaCategories = await withPrismaTimeout(() => prismaClient.category.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { isSystem: true }
                ]
            },
            orderBy: [
                { parentId: 'asc' },
                { name: 'asc' }
            ]
        }), 'getCategories')

        const categories = prismaCategories.map((c: Parameters<typeof mapToCategory>[0]) => mapToCategory(c))

        return { ...actionSuccess({ categories }), categories }

    } catch ( error ) {
        console.error('getCategories', error)
        return {
            ...asFailure(error),
            categories: null
        }
    }

}
