'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyInputToMinorUnits } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface CreateDebtInput {
    personName: string
    title: string
    direction: 'YO_DEBO' | 'ME_DEBEN'
    principalAmount: number
    currentBalance: number
    startedAt: string
    notes?: string
}

export const createDebt = async (data: CreateDebtInput) => {
    try {
        const user = await requireSessionUser()
        const startedAt = new Date(data.startedAt)

        if (!data.personName.trim()) throw new Error('La persona es requerida')
        if (!data.title.trim()) throw new Error('El título es requerido')
        if (Number.isNaN(startedAt.getTime())) throw new Error('La fecha no es válida')

        let person = await prisma.person.findFirst({
            where: {
                userId: user.id,
                name: data.personName.trim(),
            }
        })

        if (!person) {
            person = await prisma.person.create({
                data: {
                    userId: user.id,
                    name: data.personName.trim(),
                }
            })
        }

        const debt = await prisma.debt.create({
            data: {
                userId: user.id,
                personId: person.id,
                title: data.title.trim(),
                direction: data.direction,
                principalAmount: moneyInputToMinorUnits(data.principalAmount),
                currentBalance: moneyInputToMinorUnits(data.currentBalance),
                status: data.currentBalance === 0 ? 'SALDADA' : 'ACTIVA',
                startedAt,
                notes: data.notes?.trim() || null,
            }
        })

        return {
            ...actionSuccess({ debt }, 'Deuda creada'),
            debt,
        }
    } catch (error) {
        console.error('createDebt', error)
        return asFailure(error)
    }
}
