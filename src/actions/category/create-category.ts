'use server'

import type { CreateCategoryInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { revalidatePath } from 'next/cache'

export const createCategory = async (data: CreateCategoryInput & { parentId?: string }) => {
    try {
        const user = await requireSessionUser()

        if (!data.name.trim()) {
            throw new Error('El nombre de la categoría es requerido')
        }

        const name = data.name.trim()
        const duplicate = await prisma.category.findFirst({
            where: {
                OR: [{ userId: user.id }, { isSystem: true }],
                name: { equals: name, mode: 'insensitive' },
            },
        })

        if (duplicate) {
            throw new Error('Ya existe una categoría con ese nombre')
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

        const category = await prisma.category.create({
            data: {
                userId: user.id,
                name,
                color: data.color,
                parentId: data.parentId || null,
                isSystem: false,
            }
        })

        revalidatePath('/configuracion')
        return {
            ...actionSuccess({ category }, 'Categoría creada'),
            category,
        }
    } catch (error) {
        console.error('createCategory', error)
        return asFailure(error)
    }
}
