export type TransactionType = 'INGRESO' | 'GASTO' | 'TRANSPORTE' | 'TRANSFERENCIA'

export interface BaseTransaction {
    id: string
    userId: string
    type: TransactionType
    wallet: string
    title: string
    description: string
    date: string
    category: string
    amount: number
    isVisible: boolean
}

export interface TransportTransaction extends BaseTransaction {
    fareValue: number
    numberOfTrips: number
}

export interface TransferTransaction extends BaseTransaction {
    fromWallet: string
    toWallet: string
}

export type Transaction = BaseTransaction | TransportTransaction | TransferTransaction

export function isTransportTransaction(transaction: Transaction): transaction is TransportTransaction {
    return 'fareValue' in transaction && 'numberOfTrips' in transaction
}

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
    return 'fromWallet' in transaction && 'toWallet' in transaction
}

export function isStandardTransaction(transaction: Transaction): transaction is BaseTransaction {
    return !isTransportTransaction(transaction) && !isTransferTransaction(transaction)
}

export interface CreateTransactionInput {
    walletId: string
    type: TransactionType
    title: string
    description: string
    date: Date
    categoryId: string
    amount: number
    fareValue?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
}

export interface UpdateTransactionInput {
    title?: string
    description?: string
    date?: Date
    categoryId?: string
    amount: number
    newAumount?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
}