import { addMinorUnits, absMinorUnits, moneyToMinorUnits, moneyToNumber } from '@/lib/finance'

type MoneyValue = bigint | number | { toNumber(): number } | null | undefined

export interface CreditCardObligationWallet {
  id: string
  name: string
  balance: MoneyValue
  type?: string
  statementClosingDay?: number | null
  paymentDueDay?: number | null
}

export interface CreditCardObligationTransaction {
  id: string
  walletId: string
  type: string
  amount: MoneyValue
  occurredAt: Date
  toWalletId?: string | null
  installmentPlanId?: string | null
  refundedTransactionId?: string | null
}

export interface CreditCardObligationInstallment {
  id: string
  dueAt: Date
  expectedAmount: MoneyValue
  status: string
  linkedTransactionId?: string | null
  installmentPlan: {
    chargeWalletId?: string | null
    title: string
  }
}

export interface CreditCardCycleObligation {
  walletId: string
  walletName: string
  statementStartsAt: string
  statementEndsAt: string
  paymentDueAt: string
  purchasesTotal: number
  installmentsTotal: number
  paymentsApplied: number
  totalDue: number
  pendingAmount: number
  installmentCount: number
}

const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(day, 1), lastDay)
}

const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

const buildMonthlyDate = (year: number, month: number, day: number) => (
  new Date(year, month, clampDay(year, month, day), 23, 59, 59, 999)
)

const buildPaymentDueDate = (cutoffAt: Date, paymentDueDay?: number | null) => {
  if (!paymentDueDay) return cutoffAt

  let dueYear = cutoffAt.getFullYear()
  let dueMonth = cutoffAt.getMonth()

  if (paymentDueDay <= cutoffAt.getDate()) {
    const nextMonth = addMonths(new Date(dueYear, dueMonth, 1), 1)
    dueYear = nextMonth.getFullYear()
    dueMonth = nextMonth.getMonth()
  }

  return endOfDay(new Date(dueYear, dueMonth, clampDay(dueYear, dueMonth, paymentDueDay)))
}

const statementForPlanningCycle = (card: CreditCardObligationWallet, cycleStartsAt: Date, cycleEndsAt: Date) => {
  const closingDay = card.statementClosingDay ?? cycleEndsAt.getDate()
  const candidates: Array<{ startsAt: Date; endsAt: Date; dueAt: Date }> = []
  const cursor = new Date(cycleStartsAt.getFullYear(), cycleStartsAt.getMonth() - 2, 1)
  const firstAllowedClosing = endOfDay(cycleStartsAt)
  const cycleLookAhead = endOfDay(new Date(cycleEndsAt.getFullYear(), cycleEndsAt.getMonth(), cycleEndsAt.getDate() + 1))

  for (let index = 0; index < 6; index += 1) {
    const base = addMonths(cursor, index)
    const endsAt = buildMonthlyDate(base.getFullYear(), base.getMonth(), closingDay)
    const previousCutoff = buildMonthlyDate(addMonths(base, -1).getFullYear(), addMonths(base, -1).getMonth(), closingDay)
    const startsAt = new Date(previousCutoff.getTime() + 1)
    const dueAt = buildPaymentDueDate(endsAt, card.paymentDueDay)

    candidates.push({ startsAt, endsAt, dueAt })
  }

  return candidates.find((candidate) => candidate.endsAt > firstAllowedClosing && candidate.endsAt <= cycleLookAhead)
    ?? candidates.find((candidate) => candidate.endsAt > firstAllowedClosing)
    ?? {
      startsAt: cycleStartsAt,
      endsAt: cycleEndsAt,
      dueAt: buildPaymentDueDate(cycleEndsAt, card.paymentDueDay),
    }
}

export const calculateCreditCardCycleObligations = ({
  cards,
  transactions,
  installmentOccurrences,
  cycleStartsAt,
  cycleEndsAt,
}: {
  cards: CreditCardObligationWallet[]
  transactions: CreditCardObligationTransaction[]
  installmentOccurrences: CreditCardObligationInstallment[]
  cycleStartsAt: Date
  cycleEndsAt: Date
}) => cards.map((card) => {
  const statement = statementForPlanningCycle(card, cycleStartsAt, cycleEndsAt)

  const purchasesTotalMinor = transactions
    .filter((transaction) => (
      transaction.walletId === card.id
      && transaction.type === 'TARJETA_CONSUMO'
      && !transaction.installmentPlanId
      && transaction.occurredAt >= statement.startsAt
      && transaction.occurredAt <= statement.endsAt
    ))
    .reduce((sum, transaction) => addMinorUnits(sum, absMinorUnits(moneyToMinorUnits(transaction.amount))), BigInt(0))

  const pendingInstallments = installmentOccurrences.filter((occurrence) => (
    occurrence.status === 'PENDIENTE'
    && occurrence.installmentPlan.chargeWalletId === card.id
    && occurrence.dueAt >= statement.startsAt
    && occurrence.dueAt <= statement.endsAt
  ))

  const installmentsTotalMinor = pendingInstallments
    .reduce((sum, occurrence) => addMinorUnits(sum, absMinorUnits(moneyToMinorUnits(occurrence.expectedAmount))), BigInt(0))

  const paymentsAppliedMinor = transactions
    .filter((transaction) => (
      transaction.type === 'PAGO_TARJETA'
      && transaction.toWalletId === card.id
      && transaction.occurredAt >= cycleStartsAt
      && transaction.occurredAt <= cycleEndsAt
    ))
    .reduce((sum, transaction) => addMinorUnits(sum, absMinorUnits(moneyToMinorUnits(transaction.amount))), BigInt(0))

  const refundsTotalMinor = transactions
    .filter((transaction) => (
      transaction.walletId === card.id
      && transaction.type === 'TARJETA_DEVOLUCION'
      && transaction.occurredAt >= cycleStartsAt
      && transaction.occurredAt <= cycleEndsAt
    ))
    .reduce((sum, transaction) => addMinorUnits(sum, absMinorUnits(moneyToMinorUnits(transaction.amount))), BigInt(0))

  const rawTotalDueMinor = addMinorUnits(purchasesTotalMinor, installmentsTotalMinor, -refundsTotalMinor)
  const totalDueMinor = rawTotalDueMinor > BigInt(0) ? rawTotalDueMinor : BigInt(0)
  const pendingAmountMinor = totalDueMinor > paymentsAppliedMinor ? addMinorUnits(totalDueMinor, -paymentsAppliedMinor) : BigInt(0)

  return {
    walletId: card.id,
    walletName: card.name,
    statementStartsAt: statement.startsAt.toISOString(),
    statementEndsAt: statement.endsAt.toISOString(),
    paymentDueAt: statement.dueAt.toISOString(),
    purchasesTotal: moneyToNumber(purchasesTotalMinor),
    installmentsTotal: moneyToNumber(installmentsTotalMinor),
    paymentsApplied: moneyToNumber(paymentsAppliedMinor),
    totalDue: moneyToNumber(totalDueMinor),
    pendingAmount: moneyToNumber(pendingAmountMinor),
    installmentCount: pendingInstallments.length,
  }
}).filter((obligation) => obligation.totalDue > 0 || obligation.paymentsApplied > 0)
