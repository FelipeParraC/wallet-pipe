'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

export const deleteTag = async (tagId: string) => {
    try {
        const user = await requireSessionUser()
        const tag = await prisma.tag.findFirst({ where: { id: tagId, userId: user.id } })
        if (!tag) throw new Error('El tag no existe')

        await prisma.tag.delete({ where: { id: tagId } })

        revalidatePath('/configuracion')
        revalidatePath('/transacciones')
        return actionSuccess(undefined, 'Tag eliminado')
    } catch (error) {
        console.error('deleteTag', error)
        return asFailure(error)
    }
}
