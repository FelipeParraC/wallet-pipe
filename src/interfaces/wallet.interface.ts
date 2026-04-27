export type WalletType = 'Efectivo' | 'Cuenta Bancaria' | 'Ahorros' | 'Transporte' | 'Tarjeta de Crédito'

export interface Wallet {
    id: string
    userId: string
    name: string
    balance: number
    type: WalletType
    color: string
    includeInTotal: boolean
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
    fareValue?: number
    color?: string
    includeInTotal?: boolean
    creditLimit?: number
    availableCredit?: number
    statementClosingDay?: number
    paymentDueDay?: number
}
