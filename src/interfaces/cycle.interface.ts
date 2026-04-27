export interface CycleOverride {
    id: string
    effectiveFrom: string
    startDay: number
    note?: string | null
}

export interface UserCycleSettings {
    id: string
    userId: string
    defaultStartDay: number
    timezone: string
    overrides: CycleOverride[]
}

export interface CyclePeriod {
    startsAt: string
    endsAt: string
    label: string
}
