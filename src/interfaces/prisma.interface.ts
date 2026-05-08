export interface DecimalLike {
    toNumber: () => number
}

export type MoneyLike = number | bigint | DecimalLike

export type PrismaTransactionType =
    | 'INGRESO'
    | 'GASTO'
    | 'TRANSPORTE'
    | 'TRANSFERENCIA'
    | 'TARJETA_CONSUMO'
    | 'PAGO_TARJETA'
    | 'DEUDA_PRESTAMO'
    | 'DEUDA_ABONO'

export type PrismaWalletType =
    | 'EFECTIVO'
    | 'CUENTA_BANCARIA'
    | 'AHORROS'
    | 'TRANSPORTE'
    | 'TARJETA_CREDITO'

export type PrismaTransactionStatus = 'REGISTRADA' | 'PENDIENTE' | 'CANCELADA'

export interface PrismaTransaction {
    id: string
    userId: string
    type: PrismaTransactionType
    status?: PrismaTransactionStatus
    walletId: string
    title: string
    description: string
    occurredAt: Date | string | number | bigint
    recordedAt: Date | string | number | bigint
    categoryId: string | null
    amount: MoneyLike
    isVisible: boolean
    fareValue: MoneyLike | null
    numberOfTrips: number | null
    fromWalletId: string | null
    toWalletId: string | null
    scheduledPlanId?: string | null
    scheduledOccurrenceId?: string | null
    installmentPlanId?: string | null
    installmentOccurrenceId?: string | null
    personId?: string | null
    debtId?: string | null
    createdAt: Date
    updatedAt: Date
    tags?: Array<{
        tag: {
            id: string
            userId: string
            name: string
            color: string | null
        }
    }>
}

export interface PrismaWallet {
    id: string
    userId: string
    parentWalletId?: string | null
    name: string
    balance: MoneyLike
    type: PrismaWalletType
    fareValue: MoneyLike | null
    color: string
    includeInTotal: boolean
    isSavingsBox?: boolean
    isActive: boolean
    creditLimit?: MoneyLike | null
    availableCredit?: MoneyLike | null
    statementClosingDay?: number | null
    paymentDueDay?: number | null
    createdAt: Date
    updatedAt: Date
}

export interface PrismaCategory {
    id: string
    userId?: string | null
    parentId?: string | null
    name: string
    color: string
    isSystem?: boolean
    createdAt: Date
    updatedAt: Date
}
