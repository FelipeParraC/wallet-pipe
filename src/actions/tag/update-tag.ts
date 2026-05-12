'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

interface UpdateTagActionInput {
    id: string
    name?: string
    color?: string | null
}

export const updateTag = async (data: UpdateTagActionInput) => {
    try {
        const user = await requireSessionUser()
        const tag = await prisma.tag.findFirst({ where: { id: data.id, userId: user.id } })
        if (!tag) throw new Error('El tag no existe')

        const nextName = data.name?.trim().toLowerCase()
        if (nextName !== undefined && !nextName) throw new Error('El nombre del tag es requerido')

        if (nextName && nextName !== tag.name.toLowerCase()) {
            const duplicate = await prisma.tag.findFirst({
                where: {
                    id: { not: data.id },
                    userId: user.id,
                    name: { equals: nextName, mode: 'insensitive' },
                },
            })
            if (duplicate) throw new Error('Ya existe un tag con ese nombre')
        }

        const updated = await prisma.tag.update({
            where: { id: data.id },
            data: {
                name: nextName,
                color: data.color === undefined ? undefined : data.color || null,
            },
        })

        revalidatePath('/configuracion')
        revalidatePath('/movimientos')
        return actionSuccess({ tag: updated }, 'Tag actualizado')
    } catch (error) {
        logServerActionError('updateTag', error)
        return asFailure(error)
    }
}
