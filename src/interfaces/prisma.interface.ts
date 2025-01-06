export type PrismaTransactionType = 'INGRESO' | 'GASTO' | 'TRANSPORTE' | 'TRANSFERENCIA'
export type PrismaWalletType = 'EFECTIVO' | 'CUENTA_BANCARIA' | 'AHORROS' | 'TRANSPORTE'


export interface PrismaTransaction {
    id: string
    userId: string
    type: PrismaTransactionType
    walletId: string
    title: string
    description: string
    date: number
    categoryId: string
    amount: number
    isVisible: boolean
    fareValue: number | null
    numberOfTrips: number | null
    fromWalletId: string | null
    toWalletId: string | null
    createdAt: Date
    updatedAt: Date
}

export interface PrismaWallet {
    id: string
    userId: string
    name: string
    balance: number
    type: PrismaWalletType
    fareValue: number | null
    color: string
    includeInTotal: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface PrismaCategory {
    id: string
    name: string
    color: string
    createdAt: Date
    updatedAt: Date
}