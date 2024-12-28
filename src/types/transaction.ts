export interface BaseTransaction {
    id: number
    userId: string
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

