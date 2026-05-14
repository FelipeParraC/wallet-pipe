export interface CycleOverride {
    id: string
    effectiveFrom: string
    startDay: number
    note?: string | null
}

export interface CyclePeriodOverride {
    id: string
    startsAt: string
    endsAt: string
    note?: string | null
}

export interface UserCycleSettings {
    id: string
    userId: string
    defaultStartDay: number
    timezone: string
    overrides: CycleOverride[]
    periodOverrides?: CyclePeriodOverride[]
}

export interface CyclePeriod {
    startsAt: string
    endsAt: string
    label: string
    isManual?: boolean
    periodOverrideId?: string
}
