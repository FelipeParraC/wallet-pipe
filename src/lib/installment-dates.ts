const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(day, 1), lastDay)
}

const addMonthsPreservingTime = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export const buildInstallmentCutoffDate = (
  firstDueAt: Date,
  installmentIndex: number,
  statementClosingDay?: number | null,
) => {
  if (installmentIndex === 0 || !statementClosingDay) {
    return addMonthsPreservingTime(firstDueAt, installmentIndex)
  }

  const targetMonth = addMonthsPreservingTime(new Date(firstDueAt.getFullYear(), firstDueAt.getMonth(), 1), installmentIndex)

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
