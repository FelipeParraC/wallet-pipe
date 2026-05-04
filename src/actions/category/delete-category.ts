'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

export const deleteCategory = async (categoryId: string) => {
    try {
        const user = await requireSessionUser()
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId: user.id },
            include: {
                _count: {
                    select: {
                        children: true,
                        installmentPlans: true,
                        scheduledPlans: true,
                        transactions: true,
                    },
                },
            },
        })

        if (!category) throw new Error('La categoría no existe o es de sistema')

        const hasUsage = category._count.children + category._count.installmentPlans + category._count.scheduledPlans + category._count.transactions > 0
        if (hasUsage) {
            throw new Error('No se puede eliminar una categoría con historial. Edita su nombre/color o mueve primero sus usos.')
        }

        await prisma.category.delete({ where: { id: categoryId } })

        revalidatePath('/configuracion')
        revalidatePath('/transacciones')
        revalidatePath('/reportes')
        return actionSuccess(undefined, 'Categoría eliminada')
    } catch (error) {
        console.error('deleteCategory', error)
        return asFailure(error)
    }
}
