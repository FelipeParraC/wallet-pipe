import type { Prisma } from '@prisma/client'

export const syncTransactionTagsInTx = async (
    tx: Prisma.TransactionClient,
    userId: string,
    transactionId: string,
    tagIds?: string[],
) => {
    if (tagIds === undefined) return

    const uniqueTagIds = Array.from(new Set(tagIds.filter(Boolean)))

    if (uniqueTagIds.length > 0) {
        const existingTags = await tx.tag.findMany({
            where: {
                userId,
                id: { in: uniqueTagIds },
            },
            select: { id: true },
        })

        if (existingTags.length !== uniqueTagIds.length) {
            throw new Error('Uno o más tags no existen o no pertenecen al usuario')
        }
    }

    await tx.transactionTag.deleteMany({ where: { transactionId } })

    if (uniqueTagIds.length > 0) {
        await tx.transactionTag.createMany({
            data: uniqueTagIds.map((tagId) => ({ transactionId, tagId })),
        })
    }
}
