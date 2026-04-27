export type DebtDirection = 'YO_DEBO' | 'ME_DEBEN'
export type DebtStatus = 'ACTIVA' | 'SALDADA'

export interface Person {
    id: string
    userId: string
    name: string
    alias?: string
    notes?: string
}

export interface Debt {
    id: string
    userId: string
    personId: string
    title: string
    direction: DebtDirection
    principalAmount: number
    currentBalance: number
    status: DebtStatus
    startedAt: string
    settledAt?: string
    notes?: string
}
