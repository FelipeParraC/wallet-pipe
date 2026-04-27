import type { OccurrenceStatus } from './scheduled.interface'

export interface InstallmentPlan {
    id: string
    userId: string
    title: string
    description?: string
    merchant?: string
    categoryId?: string
    chargeWalletId?: string
    paymentWalletId?: string
    totalAmount: number
    installmentAmount: number
    totalInstallments: number
    remainingInstallments: number
    interestRate?: number
    occurredAt: string
    firstDueAt: string
    isActive: boolean
}

export interface InstallmentOccurrence {
    id: string
    installmentPlanId: string
    userId: string
    installmentNumber: number
    dueAt: string
    expectedAmount: number
    status: OccurrenceStatus
    linkedTransactionId?: string
}
