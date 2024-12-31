import { Category, CreateTransactionInput, PrismaCategory, PrismaTransaction, PrismaWallet, PrismaWalletType, Transaction, TransactionType, UpdateTransactionInput, Wallet, WalletType } from '@/interfaces'
import { WalletType as PWalletType, TransactionType as PrismaTransactionType } from '@prisma/client'
import { format } from 'date-fns'

export const mapToPrismaWalletType = (type: WalletType): PWalletType => {
    const mapping: Record<WalletType, PWalletType> = {
        'Efectivo': PWalletType.EFECTIVO,
        'Cuenta Bancaria': PWalletType.CUENTA_BANCARIA,
        'Ahorros': PWalletType.AHORROS,
        'Transporte': PWalletType.TRANSPORTE,
    }

    return mapping[type]
}

export const mapToWalletType = (type: PrismaWalletType): WalletType => {
    const mapping: Record<PrismaWalletType, WalletType> = {
        'EFECTIVO': 'Efectivo',
        'CUENTA_BANCARIA': 'Cuenta Bancaria',
        'AHORROS': 'Ahorros',
        'TRANSPORTE': 'Transporte',
    }

    return mapping[type]
}

export const mapToPrismaTransactionType = (type: TransactionType): PrismaTransactionType => {
    const mapping: Record<TransactionType, PrismaTransactionType> = {
        'GASTO': PrismaTransactionType.GASTO,
        'INGRESO': PrismaTransactionType.INGRESO,
        'TRANSFERENCIA': PrismaTransactionType.TRANSFERENCIA,
        'TRANSPORTE': PrismaTransactionType.TRANSPORTE,
    }

    return mapping[type]
}

export const mapToCreatePrismaTransaction = (data: CreateTransactionInput, userId: string) => {
    return {
        amount: data.amount,
        date: data.date,
        description: data.description,
        title: data.title,
        type: mapToPrismaTransactionType( data.type ),
        categoryId: data.categoryId,
        fareValue: data.fareValue,
        fromWalletId: data.fromWalletId,
        numberOfTrips: data.numberOfTrips,
        toWalletId: data.toWalletId,
        walletId: data.walletId,
        userId: userId,
    }
}

export const mapToUpdatePrismaTransaction = (data: UpdateTransactionInput) => {

    const updateData = {
        title: data.title,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId,
        amount: data.newAmount
    }

    if ( !data.numberOfTrips || !data.fareValue ) return updateData
    
    return {
        ...updateData,
        numberOfTrips: data.numberOfTrips,
        amount: -( data.numberOfTrips * data.fareValue )
    }
}

export const mapToTransaction = (data: PrismaTransaction): Transaction => {
    const transaction: Transaction = {
        id: data.id,
        userId: data.userId,
        amount: data.amount,
        categoryId: data.categoryId,
        date: format(data.date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        description: data.description,
        isVisible: data.isVisible,
        title: data.title,
        type: data.type as TransactionType,
        walletId: data.walletId
    }

    if ( data.fareValue && data.numberOfTrips ) {
        return {
            ...transaction,
            fareValue: data.fareValue,
            numberOfTrips: data.numberOfTrips
        }
    }

    if ( data.fromWalletId && data.toWalletId ) {
        return {
            ...transaction,
            fromWalletId: data.fromWalletId,
            toWalletId: data.toWalletId
        }
    }

    return transaction
}

export const mapToWallet = (data: PrismaWallet): Wallet => {
    const wallet: Wallet = {
        id: data.id,
        userId: data.userId,
        name: data.name,
        balance: data.balance,
        type: mapToWalletType( data.type ),
        color: data.color,
        includeInTotal: data.includeInTotal,
    }

    if ( data.fareValue ) {
        return {
            ...wallet,
            fareValue: data.fareValue
        }
    }

    return wallet
}

export const mapToCategory = (data: PrismaCategory): Category => {
    return {
        id: data.id,
        name: data.name,
        color: data.color
    }
}