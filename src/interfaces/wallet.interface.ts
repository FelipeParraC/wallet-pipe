import type { Transaction } from './transaction.interface'

export type WalletType = 'Efectivo' | 'Cuenta Bancaria' | 'Ahorros' | 'Transporte'

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
    transactions: Transaction[]
    createdAt: string
    updatedAt: string
}

export interface CreateWalletInput {
    userId: string
    name: string
    balance: number
    type: WalletType
    fareValue?: number
    color: string
    includeInTotal: boolean
}

export interface UpdateWalletInput {
    name?: string
    fareValue?: number
    color?: string
    includeInTotal?: boolean
}