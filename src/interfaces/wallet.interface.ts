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
