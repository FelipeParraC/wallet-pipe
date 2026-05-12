'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

export const getTags = async () => {
    try {
        const user = await requireSessionUser()
        const tags = await withPrismaTimeout(() => prisma.tag.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' },
        }), 'getTags')

        return actionSuccess({
            tags: tags.map((tag) => ({
                id: tag.id,
                userId: tag.userId,
                name: tag.name,
                color: tag.color ?? undefined,
            })),
        })
    } catch (error) {
        logServerActionError('getTags', error)
        return asFailure(error)
    }
}
