'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { moneyToNumber } from '@/lib/finance'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { mapToCategory, mapToWallet } from '@/utils'
import { logServerActionError } from '@/lib/server-action-logging'

export const getSettingsOverview = async () => {
    try {
        const user = await requireSessionUser()

        const [categories, tags, wallets, scheduledPlans, installmentPlans, debts] = await withPrismaTimeout(() => Promise.all([
            prisma.category.findMany({
                where: {
                    OR: [
                        { userId: user.id },
                        { isSystem: true },
                    ]
                },
                orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
            }),
            prisma.tag.findMany({
                where: { userId: user.id },
                orderBy: { name: 'asc' }
            }),
            prisma.wallet.findMany({
                where: { userId: user.id, isActive: true },
                include: { statementClosings: { orderBy: { statementMonth: 'desc' } } },
                orderBy: { name: 'asc' }
            }),
            prisma.scheduledPlan.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.installmentPlan.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.debt.findMany({
                where: { userId: user.id },
                include: { person: true },
                orderBy: { createdAt: 'desc' }
            }),
        ]), 'getSettingsOverview', 3500)

        return actionSuccess({
            categories: categories.map(mapToCategory),
            tags: tags.map((tag) => ({
                id: tag.id,
                userId: tag.userId,
                name: tag.name,
                color: tag.color ?? undefined,
            })),
            wallets: wallets.map(mapToWallet),
            scheduledPlans: scheduledPlans.map((plan) => ({
                id: plan.id,
                title: plan.title,
                description: plan.description,
                kind: plan.kind,
                amountMode: plan.amountMode,
                fixedAmount: plan.fixedAmount === null ? null : moneyToNumber(plan.fixedAmount),
                frequency: plan.frequency,
                dueDay: plan.dueDay,
                isActive: plan.isActive,
            })),
            installmentPlans: installmentPlans.map((plan) => ({
                id: plan.id,
                title: plan.title,
                totalAmount: moneyToNumber(plan.totalAmount),
                installmentAmount: moneyToNumber(plan.installmentAmount),
                totalInstallments: plan.totalInstallments,
                remainingInstallments: plan.remainingInstallments,
                merchant: plan.merchant,
                isActive: plan.isActive,
            })),
            debts: debts.map((debt) => ({
                id: debt.id,
                title: debt.title,
                personName: debt.person.name,
                direction: debt.direction,
                currentBalance: moneyToNumber(debt.currentBalance),
                principalAmount: moneyToNumber(debt.principalAmount),
                status: debt.status,
            })),
        })
    } catch (error) {
        logServerActionError('getSettingsOverview', error)
        return asFailure(error)
    }
}
