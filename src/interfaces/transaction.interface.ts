export type TransactionType =
    | 'INGRESO'
    | 'GASTO'
    | 'TRANSPORTE'
    | 'TRANSFERENCIA'
    | 'TARJETA_CONSUMO'
    | 'PAGO_TARJETA'
    | 'DEUDA_PRESTAMO'
    | 'DEUDA_ABONO'

export type TransactionStatus = 'REGISTRADA' | 'PENDIENTE' | 'CANCELADA'

export interface Transaction {
    id: string
    userId: string
    type: TransactionType
    status?: TransactionStatus
    walletId: string
    title: string
    description: string
    date: string
    occurredAt: string
    recordedAt: string
    categoryId?: string | null
    amount: number
    isVisible: boolean
    fareValue?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
    scheduledPlanId?: string
    scheduledOccurrenceId?: string
    installmentPlanId?: string
    installmentOccurrenceId?: string
    personId?: string
    debtId?: string
}

export interface TransportTransaction extends Transaction {
    fareValue: number
    numberOfTrips: number
}

export interface TransferTransaction extends Transaction {
    fromWalletId: string
    toWalletId: string
}

export function isTransportTransaction(transaction: Transaction): transaction is TransportTransaction {
    return transaction.type === 'TRANSPORTE' && typeof transaction.fareValue === 'number' && typeof transaction.numberOfTrips === 'number'
}

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
    return transaction.type === 'TRANSFERENCIA' && typeof transaction.fromWalletId === 'string' && typeof transaction.toWalletId === 'string'
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
    recordedAt?: number
    categoryId?: string
    amount: number
    fareValue?: number
    numberOfTrips?: number
    fromWalletId?: string
    toWalletId?: string
    status?: TransactionStatus
    scheduledPlanId?: string
    scheduledOccurrenceId?: string
    installmentPlanId?: string
    installmentOccurrenceId?: string
    personId?: string
    debtId?: string
}

export interface UpdateTransactionInput {
    title: string
    description: string
    date: number
    recordedAt?: number
    categoryId?: string
    newAmount: number
    numberOfTrips?: number
    fareValue?: number
    walletId: string
    type: TransactionType
    amount: number
    fromWalletId?: string
    toWalletId?: string
    status?: TransactionStatus
    scheduledPlanId?: string
    scheduledOccurrenceId?: string
    installmentPlanId?: string
    installmentOccurrenceId?: string
    personId?: string
    debtId?: string
}
