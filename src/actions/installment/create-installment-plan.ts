'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyInputToMinorUnits } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface CreateInstallmentPlanInput {
    title: string
    description?: string
    merchant?: string
    categoryId?: string
    chargeWalletId?: string
    paymentWalletId?: string
    totalAmount: number
    installmentAmount: number
    totalInstallments: number
    occurredAt: string
    firstDueAt: string
}

export const createInstallmentPlan = async (data: CreateInstallmentPlanInput) => {
    try {
        const user = await requireSessionUser()
        const occurredAt = new Date(data.occurredAt)
        const firstDueAt = new Date(data.firstDueAt)

        if (!data.title.trim()) throw new Error('El título es requerido')
        if (Number.isNaN(occurredAt.getTime()) || Number.isNaN(firstDueAt.getTime())) {
            throw new Error('Las fechas no son válidas')
        }

        const plan = await prisma.installmentPlan.create({
            data: {
                userId: user.id,
                title: data.title.trim(),
                description: data.description?.trim() || null,
                merchant: data.merchant?.trim() || null,
                categoryId: data.categoryId || null,
                chargeWalletId: data.chargeWalletId || null,
                paymentWalletId: data.paymentWalletId || null,
                totalAmount: moneyInputToMinorUnits(data.totalAmount),
                installmentAmount: moneyInputToMinorUnits(data.installmentAmount),
                totalInstallments: data.totalInstallments,
                remainingInstallments: data.totalInstallments,
                interestRate: 0,
                occurredAt,
                firstDueAt,
                isActive: true,
            }
        })

        await prisma.installmentOccurrence.create({
            data: {
                installmentPlanId: plan.id,
                userId: user.id,
                installmentNumber: 1,
                dueAt: firstDueAt,
                expectedAmount: moneyInputToMinorUnits(data.installmentAmount),
                status: 'PENDIENTE',
            }
        })

        return {
            ...actionSuccess({ plan }, 'Compra a cuotas creada'),
            plan,
        }
    } catch (error) {
        console.error('createInstallmentPlan', error)
        return asFailure(error)
    }
}
