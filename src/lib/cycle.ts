import { CyclePeriod, UserCycleSettings } from '@/interfaces'
import { format } from 'date-fns'

const resolveStartDay = (settings: UserCycleSettings, reference: Date) => {
  const sortedOverrides = [...settings.overrides].sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime())
  const activeOverride = sortedOverrides.filter(override => new Date(override.effectiveFrom).getTime() <= reference.getTime()).pop()
  return activeOverride?.startDay ?? settings.defaultStartDay
}

export const getCyclePeriodForDate = (settings: UserCycleSettings, referenceDate = new Date()): CyclePeriod => {
  const reference = new Date(referenceDate)
  const manualPeriod = [...(settings.periodOverrides ?? [])]
    .map((override) => ({
      ...override,
      startsAtDate: new Date(override.startsAt),
      endsAtDate: new Date(override.endsAt),
    }))
    .filter((override) => override.startsAtDate.getTime() <= reference.getTime() && override.endsAtDate.getTime() >= reference.getTime())
    .sort((a, b) => b.startsAtDate.getTime() - a.startsAtDate.getTime())[0]

  if (manualPeriod) {
    return {
      startsAt: manualPeriod.startsAtDate.toISOString(),
      endsAt: manualPeriod.endsAtDate.toISOString(),
      label: `${format(manualPeriod.startsAtDate, 'dd/MM/yyyy')} - ${format(manualPeriod.endsAtDate, 'dd/MM/yyyy')}`,
      isManual: true,
      periodOverrideId: manualPeriod.id,
    }
  }

  const startDay = resolveStartDay(settings, reference)

  const cycleStart = new Date(reference.getFullYear(), reference.getMonth(), startDay, 0, 0, 0, 0)

  if (reference.getDate() < startDay) {
    cycleStart.setMonth(cycleStart.getMonth() - 1)
  }

  const cycleEnd = new Date(cycleStart)
  cycleEnd.setMonth(cycleEnd.getMonth() + 1)
  cycleEnd.setMilliseconds(-1)

  return {
    startsAt: cycleStart.toISOString(),
    endsAt: cycleEnd.toISOString(),
    label: `${format(cycleStart, 'dd/MM/yyyy')} - ${format(cycleEnd, 'dd/MM/yyyy')}`,
    isManual: false,
  }
}
