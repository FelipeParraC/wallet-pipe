const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(day, 1), lastDay)
}

const addMonthsPreservingTime = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export interface InstallmentStatementClosing {
  statementMonth: Date | string
  closingAt: Date | string
}

const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`

const findRealClosing = (statementClosings: InstallmentStatementClosing[] | undefined, year: number, month: number) => {
  const targetKey = monthKey(year, month)
  const match = statementClosings?.find((closing) => {
    const statementMonth = new Date(closing.statementMonth)
    return monthKey(statementMonth.getFullYear(), statementMonth.getMonth()) === targetKey
  })

  return match ? new Date(match.closingAt) : null
}

export const buildInstallmentCutoffDate = (
  firstDueAt: Date,
  installmentIndex: number,
  statementClosingDay?: number | null,
  statementClosings?: InstallmentStatementClosing[],
) => {
  if (installmentIndex === 0 || !statementClosingDay) {
    return addMonthsPreservingTime(firstDueAt, installmentIndex)
  }

  const targetMonth = addMonthsPreservingTime(new Date(firstDueAt.getFullYear(), firstDueAt.getMonth(), 1), installmentIndex)
  const realClosing = findRealClosing(statementClosings, targetMonth.getFullYear(), targetMonth.getMonth())
  if (realClosing) return realClosing

  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    clampDay(targetMonth.getFullYear(), targetMonth.getMonth(), statementClosingDay),
    firstDueAt.getHours(),
    firstDueAt.getMinutes(),
    firstDueAt.getSeconds(),
    0,
  )
}
