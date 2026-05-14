'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { calculateCreditCardCycleObligations } from '@/lib/credit-card-obligations'
import { getCyclePeriodForDate } from '@/lib/cycle'
import { absMinorUnits, ensurePositiveMoney, moneyInputToMinorUnits, moneyToNumber, moneyToMinorUnits } from '@/lib/finance'
import { buildInstallmentCutoffDate } from '@/lib/installment-dates'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createTransactionInTx } from '@/lib/transaction-service'
import { mapToCategory, mapToTransaction, mapToWallet } from '@/utils'
import { logServerActionError } from '@/lib/server-action-logging'

type Db = typeof prisma | Prisma.TransactionClient
type OccurrenceStatusInput = 'PENDIENTE' | 'EJECUTADA' | 'OMITIDA' | 'CANCELADA'

interface PayOccurrenceInput {
  occurrenceId: string
  walletId: string
  amount?: number
  occurredAt?: string
  description?: string
}

interface UpdateScheduledPlanInput {
  id: string
  title?: string
  description?: string
  amountMode?: 'FIJO' | 'VARIABLE'
  fixedAmount?: number | null
  dueDay?: number | null
  startsAt?: string
  categoryId?: string | null
  sourceWalletId?: string | null
  affectsProjectedBudget?: boolean
  isActive?: boolean
}

interface UpdateInstallmentPlanInput {
  id: string
  title?: string
  description?: string | null
  merchant?: string | null
  categoryId?: string | null
  paymentWalletId?: string | null
  isActive?: boolean
}

interface PayDebtInput {
  debtId: string
  walletId: string
  amount: number
  occurredAt?: string
  description?: string
}

interface UpdateDebtInput {
  id: string
  title?: string
  personName?: string
  notes?: string | null
}

const defaultCycleSettings = (userId: string) => ({
  id: 'default',
  userId,
  defaultStartDay: 24,
  timezone: 'America/Bogota',
  overrides: [],
  periodOverrides: [],
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isTransientPrismaConnectionError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as { code?: string }).code === 'P1001'
)

const withPrismaConnectionRetry = async <T>(operation: () => Promise<T>) => {
  const delays = [150, 350]
  let lastError: unknown

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await withPrismaTimeout(operation, 'planning-prisma-operation', 2500)
    } catch (error) {
      lastError = error

      if (!isTransientPrismaConnectionError(error) || attempt === delays.length) {
        throw error
      }

      await sleep(delays[attempt])
    }
  }

  throw lastError
}

const addFrequency = (date: Date, frequency: string, interval: number) => {
  const next = new Date(date)
  if (frequency === 'DIARIA') next.setDate(next.getDate() + interval)
  if (frequency === 'SEMANAL') next.setDate(next.getDate() + 7 * interval)
  if (frequency === 'MENSUAL') next.setMonth(next.getMonth() + interval)
  if (frequency === 'ANUAL') next.setFullYear(next.getFullYear() + interval)
  return next
}

const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(day, 1), lastDay)
}

const buildMonthlyDueDate = (year: number, month: number, day: number, timeSource: Date) => (
  new Date(
    year,
    month,
    clampDay(year, month, day),
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    0,
  )
)

const getCurrentCycle = async (db: Db, userId: string, referenceDate?: Date) => {
  const settings = await db.userCycleSettings.findUnique({
    where: { userId },
    include: { overrides: true },
  })
  const periodOverrides = await db.cyclePeriodOverride.findMany({
    where: { userId },
    orderBy: { startsAt: 'desc' },
  })

  const mappedPeriodOverrides = periodOverrides.map((override) => ({
    ...override,
    startsAt: override.startsAt.toISOString(),
    endsAt: override.endsAt.toISOString(),
  }))

  const safeSettings = settings
    ? {
        ...settings,
        overrides: settings.overrides.map((override) => ({
          ...override,
          effectiveFrom: override.effectiveFrom.toISOString(),
        })),
        periodOverrides: mappedPeriodOverrides,
      }
    : { ...defaultCycleSettings(userId), periodOverrides: mappedPeriodOverrides }

  return getCyclePeriodForDate(safeSettings, referenceDate)
}

const scheduledDueDatesForCycle = (
  plan: {
    startsAt: Date
    endsAt: Date | null
    dueDay: number | null
    frequency: string
    interval: number
  },
  startsAt: Date,
  endsAt: Date,
) => {
  const lowerBound = plan.startsAt > startsAt ? plan.startsAt : startsAt
  const upperBound = plan.endsAt && plan.endsAt < endsAt ? plan.endsAt : endsAt
  const dates: Date[] = []

  if (plan.frequency === 'MENSUAL' && plan.dueDay) {
    const cursor = new Date(startsAt.getFullYear(), startsAt.getMonth(), 1)
    const endCursor = new Date(endsAt.getFullYear(), endsAt.getMonth(), 1)

    while (cursor <= endCursor) {
      const dueAt = buildMonthlyDueDate(cursor.getFullYear(), cursor.getMonth(), plan.dueDay, plan.startsAt)
      if (dueAt >= lowerBound && dueAt <= upperBound) dates.push(dueAt)
      cursor.setMonth(cursor.getMonth() + plan.interval)
    }

    return dates
  }

  let cursor = new Date(plan.startsAt)
  while (cursor < lowerBound) {
    cursor = addFrequency(cursor, plan.frequency, plan.interval)
  }

  while (cursor <= upperBound) {
    dates.push(new Date(cursor))
    cursor = addFrequency(cursor, plan.frequency, plan.interval)
  }

  return dates
}

const installmentDueDatesForCycle = (
  plan: {
    firstDueAt: Date
    totalInstallments: number
    installmentAmount: bigint
    chargeWallet?: { statementClosingDay: number | null } | null
  },
  startsAt: Date,
  endsAt: Date,
) => {
  const dates: Array<{ installmentNumber: number; dueAt: Date; expectedAmount: bigint }> = []

  for (let installmentNumber = 1; installmentNumber <= plan.totalInstallments; installmentNumber += 1) {
    const dueAt = buildInstallmentCutoffDate(plan.firstDueAt, installmentNumber - 1, plan.chargeWallet?.statementClosingDay)
    if (dueAt >= startsAt && dueAt <= endsAt) {
      dates.push({ installmentNumber, dueAt, expectedAmount: plan.installmentAmount })
    }
  }

  return dates
}

export const ensureCurrentCycleOccurrencesForUser = async (db: Db, userId: string, referenceDate?: Date) => {
  const currentCycle = await getCurrentCycle(db, userId, referenceDate)
  const startsAt = new Date(currentCycle.startsAt)
  const endsAt = new Date(currentCycle.endsAt)
  const installmentHorizonEndsAt = new Date(endsAt)
  installmentHorizonEndsAt.setDate(installmentHorizonEndsAt.getDate() + 5)

  const scheduledPlans = await db.scheduledPlan.findMany({
    where: { userId, isActive: true, startsAt: { lte: endsAt }, OR: [{ endsAt: null }, { endsAt: { gte: startsAt } }] },
    include: { occurrences: { where: { dueAt: { gte: startsAt, lte: endsAt } } } },
  })
  const installmentPlans = await db.installmentPlan.findMany({
    where: { userId, isActive: true, firstDueAt: { lte: installmentHorizonEndsAt }, remainingInstallments: { gt: 0 } },
    include: { occurrences: true, chargeWallet: true },
  })

  for (const plan of scheduledPlans) {
    const existingTimes = new Set(plan.occurrences.map((occurrence) => occurrence.dueAt.getTime()))
    const dueDates = scheduledDueDatesForCycle(plan, startsAt, endsAt)
    const expectedAmount = plan.fixedAmount ?? BigInt(0)

    for (const dueAt of dueDates) {
      if (existingTimes.has(dueAt.getTime())) continue

      await db.scheduledOccurrence.create({
        data: {
          planId: plan.id,
          userId,
          dueAt,
          expectedAmount,
          status: 'PENDIENTE',
        },
      })
    }
  }

  for (const plan of installmentPlans) {
    const existingByNumber = new Map(plan.occurrences.map((occurrence) => [occurrence.installmentNumber, occurrence]))
    const dueDates = installmentDueDatesForCycle(plan, startsAt, installmentHorizonEndsAt)

    for (const item of dueDates) {
      const existing = existingByNumber.get(item.installmentNumber)

      if (existing) {
        if (
          existing.status === 'PENDIENTE'
          && !existing.linkedTransactionId
          && existing.dueAt.getTime() !== item.dueAt.getTime()
        ) {
          await db.installmentOccurrence.update({
            where: { id: existing.id },
            data: { dueAt: item.dueAt },
          })
        }
        continue
      }

      await db.installmentOccurrence.create({
        data: {
          installmentPlanId: plan.id,
          userId,
          installmentNumber: item.installmentNumber,
          dueAt: item.dueAt,
          expectedAmount: item.expectedAmount,
          status: 'PENDIENTE',
        },
      })
    }
  }

  return { currentCycle, startsAt, endsAt }
}

const mapScheduledOccurrence = (occurrence: Prisma.ScheduledOccurrenceGetPayload<{ include: { plan: { include: { category: true } }, linkedTransaction: true } }>) => ({
  id: occurrence.id,
  planId: occurrence.planId,
  userId: occurrence.userId,
  dueAt: occurrence.dueAt.toISOString(),
  expectedAmount: moneyToNumber(occurrence.expectedAmount),
  status: occurrence.status,
  linkedTransactionId: occurrence.linkedTransactionId ?? undefined,
  plan: {
    id: occurrence.plan.id,
    title: occurrence.plan.title,
    description: occurrence.plan.description,
    kind: occurrence.plan.kind,
    amountMode: occurrence.plan.amountMode,
    fixedAmount: occurrence.plan.fixedAmount === null ? null : moneyToNumber(occurrence.plan.fixedAmount),
    frequency: occurrence.plan.frequency,
    dueDay: occurrence.plan.dueDay,
    sourceWalletId: occurrence.plan.sourceWalletId ?? undefined,
    categoryId: occurrence.plan.categoryId ?? undefined,
    categoryName: occurrence.plan.category?.name ?? undefined,
    affectsProjectedBudget: occurrence.plan.affectsProjectedBudget,
    isActive: occurrence.plan.isActive,
  },
  transaction: occurrence.linkedTransaction ? mapToTransaction(occurrence.linkedTransaction) : null,
})

const mapInstallmentOccurrence = (occurrence: Prisma.InstallmentOccurrenceGetPayload<{ include: { installmentPlan: { include: { category: true, paymentWallet: true, chargeWallet: true } }, linkedTransaction: true } }>) => ({
  id: occurrence.id,
  installmentPlanId: occurrence.installmentPlanId,
  userId: occurrence.userId,
  installmentNumber: occurrence.installmentNumber,
  dueAt: occurrence.dueAt.toISOString(),
  expectedAmount: moneyToNumber(occurrence.expectedAmount),
  status: occurrence.status,
  linkedTransactionId: occurrence.linkedTransactionId ?? undefined,
  plan: {
    id: occurrence.installmentPlan.id,
    title: occurrence.installmentPlan.title,
    description: occurrence.installmentPlan.description ?? undefined,
    merchant: occurrence.installmentPlan.merchant ?? undefined,
    categoryId: occurrence.installmentPlan.categoryId ?? undefined,
    categoryName: occurrence.installmentPlan.category?.name ?? undefined,
    paymentWalletId: occurrence.installmentPlan.paymentWalletId ?? undefined,
    chargeWalletId: occurrence.installmentPlan.chargeWalletId ?? undefined,
    totalInstallments: occurrence.installmentPlan.totalInstallments,
    remainingInstallments: occurrence.installmentPlan.remainingInstallments,
    isActive: occurrence.installmentPlan.isActive,
  },
  transaction: occurrence.linkedTransaction ? mapToTransaction(occurrence.linkedTransaction) : null,
})

export const ensureCurrentCycleOccurrences = async () => {
  try {
    const user = await requireSessionUser()
    const result = await withPrismaConnectionRetry(() => ensureCurrentCycleOccurrencesForUser(prisma, user.id))
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    revalidatePath('/')
    return actionSuccess({ currentCycle: result.currentCycle }, 'Ocurrencias del ciclo listas')
  } catch (error) {
    logServerActionError('ensureCurrentCycleOccurrences', error)
    return asFailure(error)
  }
}

export const getPlanningCycleOverview = async (referenceDate?: string) => {
  try {
    const user = await requireSessionUser()
    const cycleReference = referenceDate ? new Date(referenceDate) : undefined
    if (cycleReference && Number.isNaN(cycleReference.getTime())) throw new Error('El ciclo seleccionado no es válido')

    const { currentCycle, startsAt, endsAt } = await withPrismaConnectionRetry(() => ensureCurrentCycleOccurrencesForUser(prisma, user.id, cycleReference))

    const {
      wallets,
      categories,
      scheduledOccurrences,
      installmentOccurrences,
      scheduledPlans,
      installmentPlans,
      debts,
      transactions,
      creditCardTransactions,
      creditCardInstallmentOccurrences,
    } = await withPrismaConnectionRetry(async () => {
      const wallets = await prisma.wallet.findMany({ where: { userId: user.id, isActive: true }, orderBy: { name: 'asc' } })
      const categories = await prisma.category.findMany({
        where: { OR: [{ userId: user.id }, { isSystem: true }] },
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      })
      const scheduledOccurrences = await prisma.scheduledOccurrence.findMany({
        where: { userId: user.id, dueAt: { gte: startsAt, lte: endsAt } },
        include: { plan: { include: { category: true } }, linkedTransaction: true },
        orderBy: { dueAt: 'asc' },
      })
      const installmentOccurrences = await prisma.installmentOccurrence.findMany({
        where: { userId: user.id, dueAt: { gte: startsAt, lte: endsAt } },
        include: { installmentPlan: { include: { category: true, paymentWallet: true, chargeWallet: true } }, linkedTransaction: true },
        orderBy: { dueAt: 'asc' },
      })
      const scheduledPlans = await prisma.scheduledPlan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
      const installmentPlans = await prisma.installmentPlan.findMany({
        where: { userId: user.id },
        include: { occurrences: { orderBy: { installmentNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      })
      const debts = await prisma.debt.findMany({
        where: { userId: user.id },
        include: { person: true, transactions: { orderBy: { occurredAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      })
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id, occurredAt: { gte: startsAt, lte: endsAt } },
        orderBy: { occurredAt: 'desc' },
      })
      const creditCardTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: { in: ['TARJETA_CONSUMO', 'TARJETA_DEVOLUCION', 'PAGO_TARJETA'] },
        },
        orderBy: { occurredAt: 'desc' },
      })
      const creditCardInstallmentOccurrences = await prisma.installmentOccurrence.findMany({
        where: { userId: user.id, status: 'PENDIENTE' },
        include: { installmentPlan: { include: { category: true, paymentWallet: true, chargeWallet: true } }, linkedTransaction: true },
        orderBy: { dueAt: 'asc' },
      })

      return {
        wallets,
        categories,
        scheduledOccurrences,
        installmentOccurrences,
        scheduledPlans,
        installmentPlans,
        debts,
        transactions,
        creditCardTransactions,
        creditCardInstallmentOccurrences,
      }
    })

    const mappedScheduledOccurrences = scheduledOccurrences.map(mapScheduledOccurrence)
    const mappedInstallmentOccurrences = installmentOccurrences.map(mapInstallmentOccurrence)
    const pendingScheduled = mappedScheduledOccurrences.filter((occurrence) => occurrence.status === 'PENDIENTE' && occurrence.plan.affectsProjectedBudget)
    const pendingInstallments = mappedInstallmentOccurrences.filter((occurrence) => occurrence.status === 'PENDIENTE')
    const paidScheduled = mappedScheduledOccurrences.filter((occurrence) => occurrence.status === 'EJECUTADA')
    const paidInstallments = mappedInstallmentOccurrences.filter((occurrence) => occurrence.status === 'EJECUTADA')
    const pendingDebtTotal = debts
      .filter((debt) => debt.status === 'ACTIVA')
      .reduce((sum, debt) => sum + moneyToNumber(debt.currentBalance), 0)
    const paidInCycle = transactions
      .filter((transaction) => transaction.scheduledOccurrenceId || transaction.installmentOccurrenceId || transaction.debtId)
      .reduce((sum, transaction) => sum + Math.abs(moneyToNumber(transaction.amount)), 0)
    const creditCardObligations = calculateCreditCardCycleObligations({
      cards: wallets.filter((wallet) => wallet.type === 'TARJETA_CREDITO'),
      transactions: creditCardTransactions,
      installmentOccurrences: creditCardInstallmentOccurrences,
      cycleStartsAt: startsAt,
      cycleEndsAt: endsAt,
    })
    const pendingCreditCardTotal = creditCardObligations.reduce((sum, obligation) => sum + obligation.pendingAmount, 0)

    return actionSuccess({
      currentCycle,
      wallets: wallets.map(mapToWallet),
      categories: categories.map(mapToCategory),
      transactions: transactions.map(mapToTransaction),
      cardPaymentsInCycle: transactions
        .filter((transaction) => transaction.type === 'PAGO_TARJETA')
        .map(mapToTransaction),
      scheduledOccurrences: mappedScheduledOccurrences,
      installmentOccurrences: mappedInstallmentOccurrences,
      creditCardObligations,
      scheduledPlans: scheduledPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        kind: plan.kind,
        amountMode: plan.amountMode,
        fixedAmount: plan.fixedAmount === null ? null : moneyToNumber(plan.fixedAmount),
        frequency: plan.frequency,
        dueDay: plan.dueDay,
        startsAt: plan.startsAt.toISOString(),
        categoryId: plan.categoryId ?? undefined,
        sourceWalletId: plan.sourceWalletId ?? undefined,
        affectsProjectedBudget: plan.affectsProjectedBudget,
        isActive: plan.isActive,
      })),
      installmentPlans: installmentPlans.map((plan) => ({
        paidInstallments: plan.occurrences.filter((occurrence) => occurrence.status === 'EJECUTADA').length,
        importedPaidInstallments: plan.occurrences.filter((occurrence) => occurrence.status === 'EJECUTADA' && !occurrence.linkedTransactionId).length,
        nextDueAt: plan.occurrences
          .filter((occurrence) => occurrence.status === 'PENDIENTE')
          .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime())[0]?.dueAt.toISOString(),
        id: plan.id,
        title: plan.title,
        description: plan.description ?? undefined,
        merchant: plan.merchant ?? undefined,
        categoryId: plan.categoryId ?? undefined,
        chargeWalletId: plan.chargeWalletId ?? undefined,
        paymentWalletId: plan.paymentWalletId ?? undefined,
        totalAmount: moneyToNumber(plan.totalAmount),
        installmentAmount: moneyToNumber(plan.installmentAmount),
        totalInstallments: plan.totalInstallments,
        remainingInstallments: plan.remainingInstallments,
        occurredAt: plan.occurredAt.toISOString(),
        firstDueAt: plan.firstDueAt.toISOString(),
        isActive: plan.isActive,
      })),
      debts: debts.map((debt) => ({
        id: debt.id,
        title: debt.title,
        userId: debt.userId,
        personId: debt.personId,
        personName: debt.person.name,
        direction: debt.direction,
        principalAmount: moneyToNumber(debt.principalAmount),
        currentBalance: moneyToNumber(debt.currentBalance),
        status: debt.status,
        startedAt: debt.startedAt.toISOString(),
        settledAt: debt.settledAt?.toISOString(),
        notes: debt.notes ?? undefined,
        hasTransactions: debt.transactions.length > 0,
        payments: debt.transactions.map((transaction) => ({
          id: transaction.id,
          title: transaction.title,
          amount: moneyToNumber(transaction.amount),
          occurredAt: transaction.occurredAt.toISOString(),
        })),
      })),
      summary: {
        pendingScheduledTotal: pendingScheduled.reduce((sum, occurrence) => sum + occurrence.expectedAmount, 0),
        pendingInstallmentTotal: pendingInstallments.reduce((sum, occurrence) => sum + occurrence.expectedAmount, 0),
        pendingDebtTotal,
        pendingCreditCardTotal,
        totalObligations: pendingScheduled.reduce((sum, occurrence) => sum + occurrence.expectedAmount, 0) + pendingDebtTotal + pendingCreditCardTotal,
        paidInCycle,
        pendingCount: pendingScheduled.length + creditCardObligations.filter((obligation) => obligation.pendingAmount > 0).length,
        paidCount: paidScheduled.length + paidInstallments.length,
      },
    })
  } catch (error) {
    logServerActionError('getPlanningCycleOverview', error)
    return asFailure(error)
  }
}

const ensureOccurrenceCanChange = (status: OccurrenceStatusInput, linkedTransactionId?: string | null) => {
  if (status === 'EJECUTADA' && linkedTransactionId) {
    throw new Error('Esta ocurrencia ya tiene un movimiento vinculado')
  }
}

const updateOccurrenceStatus = async (
  kind: 'scheduled' | 'installment',
  occurrenceId: string,
  userId: string,
  status: OccurrenceStatusInput,
) => {
  if (kind === 'scheduled') {
    const occurrence = await prisma.scheduledOccurrence.findFirst({ where: { id: occurrenceId, userId } })
    if (!occurrence) throw new Error('La ocurrencia no existe')
    if (status === 'PENDIENTE') ensureOccurrenceCanChange(occurrence.status, occurrence.linkedTransactionId)
    return prisma.scheduledOccurrence.update({ where: { id: occurrenceId }, data: { status } })
  }

  const occurrence = await prisma.installmentOccurrence.findFirst({ where: { id: occurrenceId, userId } })
  if (!occurrence) throw new Error('La cuota no existe')
  if (status === 'PENDIENTE') ensureOccurrenceCanChange(occurrence.status, occurrence.linkedTransactionId)
  return prisma.installmentOccurrence.update({ where: { id: occurrenceId }, data: { status } })
}

export const skipScheduledOccurrence = async (occurrenceId: string) => {
  try {
    const user = await requireSessionUser()
    await updateOccurrenceStatus('scheduled', occurrenceId, user.id, 'OMITIDA')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    return actionSuccess(undefined, 'Pago omitido')
  } catch (error) {
    logServerActionError('skipScheduledOccurrence', error)
    return asFailure(error)
  }
}

export const reopenScheduledOccurrence = async (occurrenceId: string) => {
  try {
    const user = await requireSessionUser()
    await updateOccurrenceStatus('scheduled', occurrenceId, user.id, 'PENDIENTE')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    return actionSuccess(undefined, 'Pago reabierto')
  } catch (error) {
    logServerActionError('reopenScheduledOccurrence', error)
    return asFailure(error)
  }
}

export const skipInstallmentOccurrence = async (occurrenceId: string) => {
  try {
    const user = await requireSessionUser()
    await updateOccurrenceStatus('installment', occurrenceId, user.id, 'OMITIDA')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    return actionSuccess(undefined, 'Cuota omitida')
  } catch (error) {
    logServerActionError('skipInstallmentOccurrence', error)
    return asFailure(error)
  }
}

export const reopenInstallmentOccurrence = async (occurrenceId: string) => {
  try {
    const user = await requireSessionUser()
    await updateOccurrenceStatus('installment', occurrenceId, user.id, 'PENDIENTE')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    return actionSuccess(undefined, 'Cuota reabierta')
  } catch (error) {
    logServerActionError('reopenInstallmentOccurrence', error)
    return asFailure(error)
  }
}

export const payScheduledOccurrence = async (data: PayOccurrenceInput) => {
  try {
    const user = await requireSessionUser()
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.scheduledOccurrence.findFirst({
        where: { id: data.occurrenceId, userId: user.id },
        include: { plan: true },
      })

      if (!occurrence) throw new Error('La ocurrencia no existe')
      if (occurrence.status === 'EJECUTADA' || occurrence.linkedTransactionId) throw new Error('Esta ocurrencia ya fue pagada')

      const wallet = await tx.wallet.findFirst({ where: { id: data.walletId, userId: user.id, isActive: true } })
      if (!wallet) throw new Error('La cuenta de pago no existe o está inactiva')

      const realAmount = data.amount ?? moneyToNumber(occurrence.expectedAmount)
      ensurePositiveMoney(realAmount, 'El monto pagado')
      const occurredAt = data.occurredAt ? new Date(data.occurredAt) : occurrence.dueAt
      if (Number.isNaN(occurredAt.getTime())) throw new Error('La fecha de pago no es válida')

      const transaction = await createTransactionInTx(tx as unknown as Parameters<typeof createTransactionInTx>[0], user.id, {
        walletId: wallet.id,
        type: 'GASTO',
        title: occurrence.plan.title,
        description: data.description?.trim() || occurrence.plan.description || 'Pago programado',
        date: occurredAt.getTime(),
        recordedAt: Date.now(),
        categoryId: occurrence.plan.categoryId ?? undefined,
        amount: -Math.abs(realAmount),
        scheduledPlanId: occurrence.planId,
        scheduledOccurrenceId: occurrence.id,
      }) as { id: string }

      await tx.scheduledOccurrence.update({
        where: { id: occurrence.id },
        data: {
          status: 'EJECUTADA',
          expectedAmount: moneyInputToMinorUnits(realAmount),
          linkedTransactionId: transaction.id,
        },
      })

      return transaction
    })

    revalidatePath('/planeacion')
    revalidatePath('/movimientos')
    revalidatePath('/reportes')
    revalidatePath('/')
    return actionSuccess({ transactionId: result.id }, 'Pago registrado')
  } catch (error) {
    logServerActionError('payScheduledOccurrence', error)
    return asFailure(error)
  }
}

export const payInstallmentOccurrence = async (data: PayOccurrenceInput) => {
  try {
    const user = await requireSessionUser()
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.installmentOccurrence.findFirst({
        where: { id: data.occurrenceId, userId: user.id },
        include: { installmentPlan: true },
      })

      if (!occurrence) throw new Error('La cuota no existe')
      if (occurrence.status === 'EJECUTADA' || occurrence.linkedTransactionId) throw new Error('Esta cuota ya fue pagada')

      const walletId = data.walletId || occurrence.installmentPlan.paymentWalletId
      if (!walletId) throw new Error('Selecciona la cuenta de pago')

      const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId: user.id, isActive: true } })
      if (!wallet) throw new Error('La cuenta de pago no existe o está inactiva')

      const realAmount = data.amount ?? moneyToNumber(occurrence.expectedAmount)
      ensurePositiveMoney(realAmount, 'El monto pagado')
      const occurredAt = data.occurredAt ? new Date(data.occurredAt) : occurrence.dueAt
      if (Number.isNaN(occurredAt.getTime())) throw new Error('La fecha de pago no es válida')

      const transaction = await createTransactionInTx(tx as unknown as Parameters<typeof createTransactionInTx>[0], user.id, {
        walletId: wallet.id,
        type: 'GASTO',
        title: `Cuota ${occurrence.installmentNumber}: ${occurrence.installmentPlan.title}`,
        description: data.description?.trim() || occurrence.installmentPlan.description || 'Pago de cuota',
        date: occurredAt.getTime(),
        recordedAt: Date.now(),
        categoryId: occurrence.installmentPlan.categoryId ?? undefined,
        amount: -Math.abs(realAmount),
        installmentPlanId: occurrence.installmentPlanId,
        installmentOccurrenceId: occurrence.id,
      }) as { id: string }

      await tx.installmentOccurrence.update({
        where: { id: occurrence.id },
        data: {
          status: 'EJECUTADA',
          expectedAmount: moneyInputToMinorUnits(realAmount),
          linkedTransactionId: transaction.id,
        },
      })

      const pendingCount = await tx.installmentOccurrence.count({
        where: { installmentPlanId: occurrence.installmentPlanId, status: 'PENDIENTE' },
      })

      await tx.installmentPlan.update({
        where: { id: occurrence.installmentPlanId },
        data: {
          remainingInstallments: pendingCount,
          isActive: pendingCount > 0,
        },
      })

      return transaction
    })

    revalidatePath('/planeacion')
    revalidatePath('/movimientos')
    revalidatePath('/reportes')
    revalidatePath('/')
    return actionSuccess({ transactionId: result.id }, 'Cuota registrada')
  } catch (error) {
    logServerActionError('payInstallmentOccurrence', error)
    return asFailure(error)
  }
}

export const updateScheduledPlan = async (data: UpdateScheduledPlanInput) => {
  try {
    const user = await requireSessionUser()
    const plan = await prisma.scheduledPlan.findFirst({ where: { id: data.id, userId: user.id } })
    if (!plan) throw new Error('El plan no existe')

    await prisma.scheduledPlan.update({
      where: { id: data.id },
      data: {
        title: data.title?.trim() || undefined,
        description: data.description?.trim(),
        amountMode: data.amountMode,
        fixedAmount: data.fixedAmount === undefined ? undefined : data.fixedAmount === null ? null : moneyInputToMinorUnits(data.fixedAmount),
        dueDay: data.dueDay,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        categoryId: data.categoryId,
        sourceWalletId: data.sourceWalletId,
        affectsProjectedBudget: data.affectsProjectedBudget,
        isActive: data.isActive,
      },
    })

    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Plan actualizado')
  } catch (error) {
    logServerActionError('updateScheduledPlan', error)
    return asFailure(error)
  }
}

export const updateInstallmentPlan = async (data: UpdateInstallmentPlanInput) => {
  try {
    const user = await requireSessionUser()
    const plan = await prisma.installmentPlan.findFirst({ where: { id: data.id, userId: user.id } })
    if (!plan) throw new Error('El plan de cuotas no existe')

    await prisma.installmentPlan.update({
      where: { id: data.id },
      data: {
        title: data.title?.trim() || undefined,
        description: data.description,
        merchant: data.merchant,
        categoryId: data.categoryId,
        paymentWalletId: data.paymentWalletId,
        isActive: data.isActive,
      },
    })

    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Plan de cuotas actualizado')
  } catch (error) {
    logServerActionError('updateInstallmentPlan', error)
    return asFailure(error)
  }
}

export const deleteOrDeactivateScheduledPlan = async (planId: string) => {
  try {
    const user = await requireSessionUser()
    const plan = await prisma.scheduledPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: { occurrences: true, transactions: true },
    })
    if (!plan) throw new Error('El plan no existe')

    const hasHistory = plan.transactions.length > 0 || plan.occurrences.some((occurrence) => occurrence.status === 'EJECUTADA' || occurrence.linkedTransactionId)

    if (hasHistory) {
      await prisma.scheduledPlan.update({ where: { id: planId }, data: { isActive: false } })
      await prisma.scheduledOccurrence.updateMany({
        where: { planId, status: 'PENDIENTE' },
        data: { status: 'CANCELADA' },
      })
      revalidatePath('/planeacion')
      return actionSuccess(undefined, 'Plan desactivado para preservar el historial')
    }

    await prisma.scheduledPlan.delete({ where: { id: planId } })
    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Plan eliminado')
  } catch (error) {
    logServerActionError('deleteOrDeactivateScheduledPlan', error)
    return asFailure(error)
  }
}

export const deleteOrDeactivateInstallmentPlan = async (planId: string) => {
  try {
    const user = await requireSessionUser()
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: { occurrences: true, transactions: true },
    })
    if (!plan) throw new Error('El plan de cuotas no existe')

    const hasHistory = plan.transactions.length > 0 || plan.occurrences.some((occurrence) => occurrence.status === 'EJECUTADA' || occurrence.linkedTransactionId)

    if (hasHistory) {
      await prisma.installmentPlan.update({ where: { id: planId }, data: { isActive: false } })
      await prisma.installmentOccurrence.updateMany({
        where: { installmentPlanId: planId, status: 'PENDIENTE' },
        data: { status: 'CANCELADA' },
      })
      revalidatePath('/planeacion')
      return actionSuccess(undefined, 'Plan de cuotas desactivado para preservar el historial')
    }

    await prisma.installmentPlan.delete({ where: { id: planId } })
    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Plan de cuotas eliminado')
  } catch (error) {
    logServerActionError('deleteOrDeactivateInstallmentPlan', error)
    return asFailure(error)
  }
}

export const payDebt = async (data: PayDebtInput) => {
  try {
    const user = await requireSessionUser()
    const result = await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({ where: { id: data.debtId, userId: user.id }, include: { person: true } })
      if (!debt) throw new Error('La deuda no existe')
      if (debt.status === 'SALDADA') throw new Error('La deuda ya está saldada')

      const wallet = await tx.wallet.findFirst({ where: { id: data.walletId, userId: user.id, isActive: true } })
      if (!wallet) throw new Error('La cuenta seleccionada no existe o está inactiva')

      ensurePositiveMoney(data.amount, 'El abono')
      const paymentAmount = moneyInputToMinorUnits(data.amount)
      const currentBalance = moneyToMinorUnits(debt.currentBalance)
      if (absMinorUnits(paymentAmount) > currentBalance) throw new Error('El abono no puede superar el saldo pendiente')

      const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date()
      if (Number.isNaN(occurredAt.getTime())) throw new Error('La fecha del abono no es válida')

      const isMoneyComingIn = debt.direction === 'ME_DEBEN'
      const transaction = await createTransactionInTx(tx as unknown as Parameters<typeof createTransactionInTx>[0], user.id, {
        walletId: wallet.id,
        type: isMoneyComingIn ? 'INGRESO' : 'DEUDA_ABONO',
        title: isMoneyComingIn ? `Abono recibido: ${debt.title}` : `Abono deuda: ${debt.title}`,
        description: data.description?.trim() || `Abono con ${debt.person.name}`,
        date: occurredAt.getTime(),
        recordedAt: Date.now(),
        amount: isMoneyComingIn ? data.amount : -Math.abs(data.amount),
        debtId: debt.id,
        personId: debt.personId,
      }) as { id: string }

      const nextBalance = currentBalance - absMinorUnits(paymentAmount)
      await tx.debt.update({
        where: { id: debt.id },
        data: {
          currentBalance: nextBalance,
          status: nextBalance === BigInt(0) ? 'SALDADA' : 'ACTIVA',
          settledAt: nextBalance === BigInt(0) ? new Date() : null,
        },
      })

      return transaction
    })

    revalidatePath('/planeacion')
    revalidatePath('/movimientos')
    revalidatePath('/reportes')
    revalidatePath('/')
    return actionSuccess({ transactionId: result.id }, 'Abono registrado')
  } catch (error) {
    logServerActionError('payDebt', error)
    return asFailure(error)
  }
}

export const updateDebt = async (data: UpdateDebtInput) => {
  try {
    const user = await requireSessionUser()
    const debt = await prisma.debt.findFirst({ where: { id: data.id, userId: user.id } })
    if (!debt) throw new Error('La deuda no existe')

    let personId: string | undefined
    const personName = data.personName?.trim()

    if (personName) {
      let person = await prisma.person.findFirst({
        where: { userId: user.id, name: { equals: personName, mode: 'insensitive' } },
      })

      if (!person) {
        person = await prisma.person.create({ data: { userId: user.id, name: personName } })
      }

      personId = person.id
    }

    await prisma.debt.update({
      where: { id: data.id },
      data: {
        title: data.title?.trim() || undefined,
        personId,
        notes: data.notes,
      },
    })

    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Deuda actualizada')
  } catch (error) {
    logServerActionError('updateDebt', error)
    return asFailure(error)
  }
}

export const deleteOrCloseDebt = async (debtId: string) => {
  try {
    const user = await requireSessionUser()
    const debt = await prisma.debt.findFirst({ where: { id: debtId, userId: user.id }, include: { transactions: true } })
    if (!debt) throw new Error('La deuda no existe')

    if (debt.transactions.length > 0) {
      await prisma.debt.update({
        where: { id: debtId },
        data: {
          status: 'SALDADA',
          currentBalance: BigInt(0),
          settledAt: new Date(),
        },
      })
      revalidatePath('/planeacion')
      return actionSuccess(undefined, 'Deuda cerrada para preservar el historial')
    }

    await prisma.debt.delete({ where: { id: debtId } })
    revalidatePath('/planeacion')
    return actionSuccess(undefined, 'Deuda eliminada')
  } catch (error) {
    logServerActionError('deleteOrCloseDebt', error)
    return asFailure(error)
  }
}
