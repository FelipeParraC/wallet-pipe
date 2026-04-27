'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyInputToMinorUnits } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface CreateScheduledPlanInput {
    title: string
    description: string
    kind: 'SUSCRIPCION' | 'SERVICIO' | 'PAGO_PROGRAMADO'
    amountMode: 'FIJO' | 'VARIABLE'
    fixedAmount?: number
    frequency: 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
    dueDay?: number
    startsAt: string
    categoryId?: string
    sourceWalletId?: string
    targetWalletId?: string
    affectsProjectedBudget: boolean
}

export const createScheduledPlan = async (data: CreateScheduledPlanInput) => {
    try {
        const user = await requireSessionUser()
        const startsAt = new Date(data.startsAt)

        if (!data.title.trim()) throw new Error('El título es requerido')
        if (Number.isNaN(startsAt.getTime())) throw new Error('La fecha inicial no es válida')

        const plan = await prisma.scheduledPlan.create({
            data: {
                userId: user.id,
                title: data.title.trim(),
                description: data.description.trim(),
                kind: data.kind,
                amountMode: data.amountMode,
                fixedAmount: data.fixedAmount !== undefined ? moneyInputToMinorUnits(data.fixedAmount) : null,
                frequency: data.frequency,
                interval: 1,
                dueDay: data.dueDay ?? null,
                startsAt,
                categoryId: data.categoryId || null,
                sourceWalletId: data.sourceWalletId || null,
                targetWalletId: data.targetWalletId || null,
                affectsProjectedBudget: data.affectsProjectedBudget,
                isActive: true,
            }
        })

        if (data.fixedAmount !== undefined) {
            await prisma.scheduledOccurrence.create({
                data: {
                    planId: plan.id,
                    userId: user.id,
                    dueAt: data.dueDay
                        ? new Date(startsAt.getFullYear(), startsAt.getMonth(), data.dueDay, startsAt.getHours(), startsAt.getMinutes(), startsAt.getSeconds())
                        : startsAt,
                    expectedAmount: moneyInputToMinorUnits(data.fixedAmount),
                    status: 'PENDIENTE',
                }
            })
        }

        return {
            ...actionSuccess({ plan }, 'Pago programado creado'),
            plan,
        }
    } catch (error) {
        console.error('createScheduledPlan', error)
        return asFailure(error)
    }
}
