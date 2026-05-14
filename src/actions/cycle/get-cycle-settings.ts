'use server'

import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { withPrismaTimeout } from '@/lib/prisma-timeout'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

const defaultCycleSettings = (userId: string) => ({
    id: 'default',
    userId,
    defaultStartDay: 24,
    timezone: 'America/Bogota',
    overrides: [],
    periodOverrides: [],
})

export const getCycleSettings = async () => {
    try {
        const user = await requireSessionUser()

        const cycleSettings = await withPrismaTimeout(() => prisma.userCycleSettings.findUnique({
            where: { userId: user.id },
            include: { overrides: { orderBy: { effectiveFrom: 'desc' } } }
        }), 'getCycleSettings')
        const periodOverrides = await withPrismaTimeout(() => prisma.cyclePeriodOverride.findMany({
            where: { userId: user.id },
            orderBy: { startsAt: 'desc' },
            take: 12,
        }), 'getCyclePeriodOverrides')

        const mappedPeriodOverrides = periodOverrides.map((override) => ({
            ...override,
            startsAt: override.startsAt.toISOString(),
            endsAt: override.endsAt.toISOString(),
        }))

        const data = cycleSettings
            ? {
                ...cycleSettings,
                overrides: cycleSettings.overrides.map((override) => ({
                    ...override,
                    effectiveFrom: override.effectiveFrom.toISOString(),
                })),
                periodOverrides: mappedPeriodOverrides,
            }
            : { ...defaultCycleSettings(user.id), periodOverrides: mappedPeriodOverrides }

        return actionSuccess({ cycleSettings: data })
    } catch (error) {
        logServerActionError('getCycleSettings', error)
        return asFailure(error)
    }
}
