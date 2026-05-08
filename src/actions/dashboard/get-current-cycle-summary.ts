'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { calculateCreditCardCycleObligations } from '@/lib/credit-card-obligations'
import { getCyclePeriodForDate } from '@/lib/cycle'
import { moneyToNumber, normalizeDateValue } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { mapToTransaction, mapToWallet } from '@/utils'
import type { PrismaTransaction, PrismaWallet, Transaction, Wallet } from '@/interfaces'

type CycleOverrideRecord = {
    id: string
    effectiveFrom: Date
    startDay: number
    note?: string | null
}

type UserCycleSettingsRecord = {
    id: string
    userId: string
    defaultStartDay: number
    timezone: string
    overrides: CycleOverrideRecord[]
}

type OccurrenceRecord = {
    expectedAmount: number
}

type InstallmentOccurrenceRecord = {
    id: string
    dueAt: Date
    expectedAmount: number
    status: string
    linkedTransactionId?: string | null
    installmentPlan: {
        chargeWalletId?: string | null
        title: string
    }
}

type DashboardReader = {
    userCycleSettings: {
        findUnique: (args: unknown) => Promise<UserCycleSettingsRecord | null>
    }
    transaction: {
        findMany: (args: unknown) => Promise<PrismaTransaction[]>
    }
    wallet: {
        findMany: (args: unknown) => Promise<PrismaWallet[]>
    }
    scheduledOccurrence: {
        findMany: (args: unknown) => Promise<OccurrenceRecord[]>
    }
    installmentOccurrence: {
        findMany: (args: unknown) => Promise<InstallmentOccurrenceRecord[]>
    }
    debt: {
        findMany: (args: unknown) => Promise<Array<{ currentBalance: number, status: string }>>
    }
}

const defaultCycleSettings = (userId: string) => ({
    id: 'default',
    userId,
    defaultStartDay: 1,
    timezone: 'America/Bogota',
    overrides: [],
})

export const getCurrentCycleSummary = async () => {
    try {
        const user = await requireSessionUser()
        const prismaClient = prisma as unknown as DashboardReader

        const cycleSettings = await prismaClient.userCycleSettings.findUnique({
            where: { userId: user.id },
            include: { overrides: true }
        })

        const safeSettings = cycleSettings ? {
            ...cycleSettings,
            overrides: cycleSettings.overrides.map((override) => ({
                ...override,
                effectiveFrom: override.effectiveFrom.toISOString()
            }))
        } : defaultCycleSettings(user.id)

        const currentCycle = getCyclePeriodForDate(safeSettings)
        const startsAt = new Date(currentCycle.startsAt)
        const endsAt = new Date(currentCycle.endsAt)

        const [transactionsDb, walletsDb, scheduledDb, installmentDb, debtsDb, creditCardTransactionsDb] = await Promise.all([
            prismaClient.transaction.findMany({
                where: {
                    userId: user.id,
                    occurredAt: { gte: startsAt, lte: endsAt }
                },
                orderBy: { occurredAt: 'desc' }
            }),
            prismaClient.wallet.findMany({
                where: { userId: user.id, isActive: true },
                orderBy: { createdAt: 'asc' }
            }),
            prismaClient.scheduledOccurrence.findMany({
                where: {
                    userId: user.id,
                    dueAt: { gte: startsAt, lte: endsAt },
                    status: 'PENDIENTE'
                }
            }),
            prismaClient.installmentOccurrence.findMany({
                where: {
                    userId: user.id,
                    dueAt: { gte: startsAt, lte: endsAt },
                    status: 'PENDIENTE'
                },
                include: { installmentPlan: { select: { chargeWalletId: true, title: true } } }
            }),
            prismaClient.debt.findMany({
                where: { userId: user.id, status: 'ACTIVA' },
                select: { currentBalance: true, status: true },
            }),
            prismaClient.transaction.findMany({
                where: {
                    userId: user.id,
                    type: { in: ['TARJETA_CONSUMO', 'PAGO_TARJETA'] },
                },
                orderBy: { occurredAt: 'desc' },
            }),
        ])

        const transactions: Transaction[] = transactionsDb.map((transaction: Parameters<typeof mapToTransaction>[0]) => mapToTransaction(transaction))
        const wallets: Wallet[] = walletsDb.map((wallet: Parameters<typeof mapToWallet>[0]) => mapToWallet(wallet))
        const pendingScheduledTotal = scheduledDb.reduce((sum: number, occurrence: { expectedAmount: number }) => sum + moneyToNumber(occurrence.expectedAmount), 0)
        const pendingInstallmentTotal = installmentDb.reduce((sum: number, occurrence: { expectedAmount: number }) => sum + moneyToNumber(occurrence.expectedAmount), 0)
        const pendingDebtTotal = debtsDb.reduce((sum: number, debt: { currentBalance: number }) => sum + moneyToNumber(debt.currentBalance), 0)
        const periodExpenses = transactions
            .filter((transaction: Transaction) => transaction.isVisible && transaction.amount < 0 && transaction.type !== 'TRANSFERENCIA')
            .reduce((sum: number, transaction: Transaction) => sum + Math.abs(transaction.amount), 0)
        const periodIncome = transactions
            .filter((transaction: Transaction) => transaction.isVisible && transaction.amount > 0 && transaction.type !== 'TRANSFERENCIA')
            .reduce((sum: number, transaction: Transaction) => sum + transaction.amount, 0)

        const totalAvailable = wallets
            .filter((wallet: Wallet) => wallet.includeInTotal && wallet.type !== 'Tarjeta de Crédito')
            .reduce((sum: number, wallet: Wallet) => sum + wallet.balance, 0)

        const creditCards = wallets.filter((wallet: Wallet) => wallet.type === 'Tarjeta de Crédito')
        const totalCreditDebt = creditCards.reduce((sum: number, wallet: Wallet) => sum + wallet.balance, 0)
        const creditCardObligations = calculateCreditCardCycleObligations({
            cards: walletsDb.filter((wallet) => wallet.type === 'TARJETA_CREDITO'),
            transactions: creditCardTransactionsDb.map((transaction) => ({
                ...transaction,
                occurredAt: normalizeDateValue(transaction.occurredAt),
            })),
            installmentOccurrences: installmentDb.map((occurrence) => ({
                ...occurrence,
                dueAt: new Date(occurrence.dueAt),
            })),
            cycleStartsAt: startsAt,
            cycleEndsAt: endsAt,
        })
        const pendingCreditCardTotal = creditCardObligations.reduce((sum, obligation) => sum + obligation.pendingAmount, 0)
        const totalObligations = pendingScheduledTotal + pendingDebtTotal + pendingCreditCardTotal
        const projectedAvailable = totalAvailable - totalObligations

        return actionSuccess({
            currentCycle,
            transactions,
            wallets,
            summary: {
                totalAvailable,
                projectedAvailable,
                periodExpenses,
                periodIncome,
                pendingScheduledTotal,
                pendingInstallmentTotal,
                pendingDebtTotal,
                pendingCreditCardTotal,
                totalObligations,
                creditCardObligations,
                totalCreditDebt,
                obligationCount: scheduledDb.length + creditCardObligations.filter((obligation) => obligation.pendingAmount > 0).length + debtsDb.length,
            }
        })
    } catch (error) {
        console.error('getCurrentCycleSummary', error)
        return asFailure(error)
    }
}
