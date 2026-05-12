'use server'

import type { CreateTagInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { revalidatePath } from 'next/cache'
import { logServerActionError } from '@/lib/server-action-logging'

export const createTag = async (data: CreateTagInput) => {
    try {
        const user = await requireSessionUser()

        if (!data.name.trim()) {
            throw new Error('El nombre del tag es requerido')
        }

        const existing = await prisma.tag.findFirst({
            where: {
                userId: user.id,
                name: data.name.trim().toLowerCase(),
            }
        })

        if (existing) {
            throw new Error('Ya existe un tag con ese nombre')
        }

        const tag = await prisma.tag.create({
            data: {
                userId: user.id,
                name: data.name.trim().toLowerCase(),
                color: data.color || null,
            }
        })

        revalidatePath('/configuracion')
        return {
            ...actionSuccess({ tag }, 'Tag creado'),
            tag,
        }
    } catch (error) {
        logServerActionError('createTag', error)
        return asFailure(error)
    }
}
