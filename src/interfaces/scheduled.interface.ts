export type ScheduledPlanKind = 'SUSCRIPCION' | 'SERVICIO' | 'PAGO_PROGRAMADO'
export type AmountMode = 'FIJO' | 'VARIABLE'
export type RecurrenceFrequency = 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
export type OccurrenceStatus = 'PENDIENTE' | 'EJECUTADA' | 'OMITIDA' | 'CANCELADA'

export interface ScheduledPlan {
    id: string
    userId: string
    title: string
    description: string
    kind: ScheduledPlanKind
    amountMode: AmountMode
    fixedAmount?: number
    frequency: RecurrenceFrequency
    interval: number
    dueDay?: number
    startsAt: string
    endsAt?: string
    targetWalletId?: string
    sourceWalletId?: string
    categoryId?: string
    affectsProjectedBudget: boolean
    isActive: boolean
}

export interface ScheduledOccurrence {
    id: string
    planId: string
    userId: string
    dueAt: string
    expectedAmount: number
    status: OccurrenceStatus
    linkedTransactionId?: string
}
