'use server'

import type { CreateCategoryInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

export const createCategory = async (data: CreateCategoryInput & { parentId?: string }) => {
    try {
        const user = await requireSessionUser()

        if (!data.name.trim()) {
            throw new Error('El nombre de la categoría es requerido')
        }

        const category = await prisma.category.create({
            data: {
                userId: user.id,
                name: data.name.trim(),
                color: data.color,
                parentId: data.parentId || null,
                isSystem: false,
            }
        })

        return {
            ...actionSuccess({ category }, 'Categoría creada'),
            category,
        }
    } catch (error) {
        console.error('createCategory', error)
        return asFailure(error)
    }
}
