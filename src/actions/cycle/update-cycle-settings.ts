'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

interface UpdateCycleSettingsInput {
    defaultStartDay: number
    timezone: string
}

export const updateCycleSettings = async (data: UpdateCycleSettingsInput) => {
    try {
        const user = await requireSessionUser()

        if (!Number.isInteger(data.defaultStartDay) || data.defaultStartDay < 1 || data.defaultStartDay > 31) {
            throw new Error('El día de inicio del ciclo debe estar entre 1 y 31')
        }

        if (!data.timezone.trim()) {
            throw new Error('La zona horaria es requerida')
        }

        const cycleSettings = await prisma.userCycleSettings.upsert({
            where: { userId: user.id },
            update: {
                defaultStartDay: data.defaultStartDay,
                timezone: data.timezone.trim(),
            },
            create: {
                userId: user.id,
                defaultStartDay: data.defaultStartDay,
                timezone: data.timezone.trim(),
            }
        })

        return {
            ...actionSuccess({ cycleSettings }, 'Configuración del ciclo actualizada'),
            cycleSettings,
        }
    } catch (error) {
        logServerActionError('updateCycleSettings', error)
        return asFailure(error)
    }
}
