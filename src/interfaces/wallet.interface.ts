export type WalletType = 'Efectivo' | 'Cuenta Bancaria' | 'Ahorros' | 'Transporte' | 'Tarjeta de Crédito'

export interface Wallet {
    id: string
    userId: string
    parentWalletId?: string | null
    name: string
    balance: number
    type: WalletType
    color: string
    includeInTotal: boolean
    isSavingsBox: boolean
    fareValue?: number
    isActive: boolean
    creditLimit?: number
    availableCredit?: number
    statementClosingDay?: number
    paymentDueDay?: number
    statementClosings?: CreditCardStatementClosing[]
    creditCardPayment?: CreditCardPaymentSummary
}

export interface CreditCardStatementClosing {
    id: string
    walletId: string
    statementMonth: string
    closingAt: string
    note?: string | null
}

export interface CreditCardPaymentSummary {
    statementStartsAt?: string
    statementEndsAt?: string
    paymentDueAt?: string
    totalDue: number
    pendingAmount: number
    purchasesTotal: number
    installmentsTotal: number
    paymentsApplied: number
    installmentCount: number
}

export interface CreateWalletInput {
    name: string
    balance: number
    type: WalletType
    parentWalletId?: string | null
    isSavingsBox?: boolean
    fareValue?: number
    color: string
    includeInTotal: boolean
    creditLimit?: number
    availableCredit?: number
    statementClosingDay?: number
    paymentDueDay?: number
}

export interface UpdateWalletInput {
    name?: string
    parentWalletId?: string | null
    isSavingsBox?: boolean
    fareValue?: number
    color?: string
    includeInTotal?: boolean
    creditLimit?: number
    availableCredit?: number
    statementClosingDay?: number
    paymentDueDay?: number
}
