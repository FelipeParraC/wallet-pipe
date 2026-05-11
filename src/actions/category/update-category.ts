'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface UpdateCategoryActionInput {
    id: string
    name?: string
    color?: string
    parentId?: string | null
}

export const updateCategory = async (data: UpdateCategoryActionInput) => {
    try {
        const user = await requireSessionUser()
        const category = await prisma.category.findFirst({ where: { id: data.id, userId: user.id } })
        if (!category) throw new Error('La categoría no existe o es de sistema')

        const nextName = data.name?.trim()
        if (nextName !== undefined && !nextName) throw new Error('El nombre de la categoría es requerido')
        if (data.parentId && data.parentId === data.id) throw new Error('Una categoría no puede ser su propia padre')

        if (nextName && nextName.toLowerCase() !== category.name.toLowerCase()) {
            const duplicate = await prisma.category.findFirst({
                where: {
                    id: { not: data.id },
                    OR: [{ userId: user.id }, { isSystem: true }],
                    name: { equals: nextName, mode: 'insensitive' },
                },
            })
            if (duplicate) throw new Error('Ya existe una categoría con ese nombre')
        }

        if (data.parentId) {
            const parent = await prisma.category.findFirst({
                where: {
                    id: data.parentId,
                    OR: [{ userId: user.id }, { isSystem: true }],
                },
            })
            if (!parent) throw new Error('La categoría padre no existe')
        }

        const updated = await prisma.category.update({
            where: { id: data.id },
            data: {
                name: nextName,
                color: data.color,
                parentId: data.parentId === undefined ? undefined : data.parentId || null,
            },
        })

        revalidatePath('/configuracion')
        revalidatePath('/movimientos')
        revalidatePath('/reportes')
        return actionSuccess({ category: updated }, 'Categoría actualizada')
    } catch (error) {
        console.error('updateCategory', error)
        return asFailure(error)
    }
}
