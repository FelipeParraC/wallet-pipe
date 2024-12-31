export type TransactionType = 'INGRESO' | 'GASTO' | 'TRANSPORTE' | 'TRANSFERENCIA'

export interface Transaction {
    id: string
    userId: string
    type: TransactionType
    walletId: string
    title: string
    description: string
    date: string
    categoryId: string
    amount: number
    isVisible: boolean
    fareValue?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
}

export interface TransportTransaction extends Transaction {
    fareValue: number
    numberOfTrips: number
}

export interface TransferTransaction extends Transaction {
    fromWallet: string
    toWallet: string
}

export function isTransportTransaction(transaction: Transaction): transaction is TransportTransaction {
    return 'fareValue' in transaction && 'numberOfTrips' in transaction
}

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
    return 'fromWallet' in transaction && 'toWallet' in transaction
}

export function isStandardTransaction(transaction: Transaction): transaction is Transaction {
    return !isTransportTransaction(transaction) && !isTransferTransaction(transaction)
}

export interface CreateTransactionInput {
    walletId: string
    type: TransactionType
    title: string
    description: string
    date: number
    categoryId: string
    amount: number
    fareValue?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
}

export interface UpdateTransactionInput {
    title: string
    description: string
    date: number
    categoryId: string
    newAmount: number
    numberOfTrips?: number
    fareValue?: number
    walletId: string
    type: TransactionType
    amount: number
    fromWalletId?: string
    toWalletId?: string
}