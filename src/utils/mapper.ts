import { Category, CreateTransactionInput, CreateUserInput, CreateWalletInput, PrismaCategory, PrismaTransaction, PrismaTransactionType, PrismaWallet, PrismaWalletType, Transaction, TransactionType, UpdateTransactionInput, UpdateWalletInput, Wallet, WalletType } from '@/interfaces'
import { TransactionType as PrismaClientTransactionType, WalletType as PrismaClientWalletType } from '@prisma/client'
import { format } from 'date-fns'
import { capitalizar } from './capitalizar'
import bcryptjs from 'bcryptjs';
import { moneyInputToMinorUnits, moneyToNumber, normalizeDateValue, normalizeOptionalMoney } from '@/lib/finance';

export const mapToPrismaWalletType = (type: WalletType): PrismaWalletType => {
    const mapping: Record<WalletType, PrismaWalletType> = {
        'Efectivo': PrismaClientWalletType.EFECTIVO,
        'Cuenta Bancaria': PrismaClientWalletType.CUENTA_BANCARIA,
        'Ahorros': PrismaClientWalletType.AHORROS,
        'Transporte': PrismaClientWalletType.TRANSPORTE,
        'Tarjeta de Crédito': PrismaClientWalletType.TARJETA_CREDITO,
    }

    return mapping[type]
}

export const mapToWalletType = (type: PrismaWalletType): WalletType => {
    const mapping: Record<PrismaWalletType, WalletType> = {
        'EFECTIVO': 'Efectivo',
        'CUENTA_BANCARIA': 'Cuenta Bancaria',
        'AHORROS': 'Ahorros',
        'TRANSPORTE': 'Transporte',
        'TARJETA_CREDITO': 'Tarjeta de Crédito',
    }

    return mapping[type]
}

export const mapToPrismaTransactionType = (type: TransactionType): PrismaTransactionType => {
    const mapping: Record<TransactionType, PrismaTransactionType> = {
        'GASTO': PrismaClientTransactionType.GASTO,
        'INGRESO': PrismaClientTransactionType.INGRESO,
        'TRANSFERENCIA': PrismaClientTransactionType.TRANSFERENCIA,
        'TRANSPORTE': PrismaClientTransactionType.TRANSPORTE,
        'TARJETA_CONSUMO': PrismaClientTransactionType.TARJETA_CONSUMO,
        'PAGO_TARJETA': PrismaClientTransactionType.PAGO_TARJETA,
        'DEUDA_PRESTAMO': PrismaClientTransactionType.DEUDA_PRESTAMO,
        'DEUDA_ABONO': PrismaClientTransactionType.DEUDA_ABONO,
    }

    return mapping[type]
}

export const mapToCreatePrismaTransaction = (data: CreateTransactionInput, userId: string) => {
    return {
        amount: moneyInputToMinorUnits(data.amount),
        occurredAt: new Date( data.date ),
        recordedAt: new Date( data.recordedAt ?? Date.now() ),
        description: data.description,
        title: data.title,
        type: mapToPrismaTransactionType( data.type ),
        categoryId: data.categoryId ?? null,
        fareValue: normalizeOptionalMoney(data.fareValue),
        fromWalletId: data.fromWalletId,
        numberOfTrips: data.numberOfTrips,
        debtId: data.debtId ?? null,
        installmentOccurrenceId: data.installmentOccurrenceId ?? null,
        installmentPlanId: data.installmentPlanId ?? null,
        personId: data.personId ?? null,
        scheduledOccurrenceId: data.scheduledOccurrenceId ?? null,
        scheduledPlanId: data.scheduledPlanId ?? null,
        status: data.status ?? 'REGISTRADA',
        toWalletId: data.toWalletId,
        walletId: data.walletId,
        userId: userId,
    }
}

export const mapToUpdatePrismaTransaction = (data: UpdateTransactionInput) => {

    const updateData = {
        title: data.title,
        description: data.description,
        occurredAt: new Date(data.date),
        recordedAt: new Date(data.recordedAt ?? Date.now()),
        categoryId: data.categoryId ?? null,
        amount: moneyInputToMinorUnits(data.newAmount),
        debtId: data.debtId ?? null,
        installmentOccurrenceId: data.installmentOccurrenceId ?? null,
        installmentPlanId: data.installmentPlanId ?? null,
        personId: data.personId ?? null,
        scheduledOccurrenceId: data.scheduledOccurrenceId ?? null,
        scheduledPlanId: data.scheduledPlanId ?? null,
        status: data.status ?? 'REGISTRADA',
    }

    if ( !data.numberOfTrips || !data.fareValue ) return updateData
    
    return {
        ...updateData,
        numberOfTrips: data.numberOfTrips,
            amount: moneyInputToMinorUnits(-( data.numberOfTrips * data.fareValue ))
    }
}

export const mapToTransaction = (data: PrismaTransaction): Transaction => {
    const transaction: Transaction = {
        id: data.id,
        userId: data.userId,
        amount: moneyToNumber(data.amount),
        categoryId: data.categoryId,
        occurredAt: format(normalizeDateValue( data.occurredAt ), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        recordedAt: format(normalizeDateValue( data.recordedAt ), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        date: format(normalizeDateValue( data.occurredAt ), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        description: data.description,
        isVisible: data.isVisible,
        status: data.status as Transaction['status'],
        title: data.title,
        type: data.type as TransactionType,
        walletId: data.walletId,
        debtId: data.debtId ?? undefined,
        installmentOccurrenceId: data.installmentOccurrenceId ?? undefined,
        installmentPlanId: data.installmentPlanId ?? undefined,
        personId: data.personId ?? undefined,
        scheduledOccurrenceId: data.scheduledOccurrenceId ?? undefined,
        scheduledPlanId: data.scheduledPlanId ?? undefined,
        tagIds: data.tags?.map((item) => item.tag.id),
        tags: data.tags?.map((item) => ({
            id: item.tag.id,
            userId: item.tag.userId,
            name: item.tag.name,
            color: item.tag.color ?? undefined,
        })),
    }

    if ( data.fareValue && data.numberOfTrips ) {
        return {
            ...transaction,
            fareValue: moneyToNumber(data.fareValue),
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
        balance: moneyToNumber(data.balance),
        type: mapToWalletType( data.type ),
        color: data.color,
        includeInTotal: data.includeInTotal,
        isActive: data.isActive,
        creditLimit: moneyToNumber(data.creditLimit),
        availableCredit: moneyToNumber(data.availableCredit),
        statementClosingDay: data.statementClosingDay ?? undefined,
        paymentDueDay: data.paymentDueDay ?? undefined,
    }

    if ( data.fareValue ) {
        return {
            ...wallet,
            fareValue: moneyToNumber(data.fareValue)
        }
    }

    return wallet
}

export const mapToCategory = (data: PrismaCategory): Category => {
    return {
        id: data.id,
        userId: data.userId ?? null,
        name: data.name,
        color: data.color,
        parentId: data.parentId ?? null,
        isSystem: data.isSystem ?? false,
    }
}

export const mapToUpdatePrismaWallet = (data: UpdateWalletInput) => {

    const updateData = {
        name: data.name,
        color: data.color,
        includeInTotal: data.includeInTotal,
        creditLimit: normalizeOptionalMoney(data.creditLimit),
        availableCredit: normalizeOptionalMoney(data.availableCredit),
        statementClosingDay: data.statementClosingDay,
        paymentDueDay: data.paymentDueDay,
    }
    
    if ( !data.fareValue ) return updateData
    
    return {
        ...updateData,
        fareValue: normalizeOptionalMoney(data.fareValue)
    }
}

export const mapToCreatePrismaWallet = (data: CreateWalletInput, userId: string) => {

    const walletData = {
        userId: userId,
        name: data.name,
        balance: moneyInputToMinorUnits(data.balance),
        type: mapToPrismaWalletType( data.type ),
        color: data.color,
        includeInTotal: data.includeInTotal,
        creditLimit: normalizeOptionalMoney(data.creditLimit),
        availableCredit: normalizeOptionalMoney(data.availableCredit),
        statementClosingDay: data.statementClosingDay,
        paymentDueDay: data.paymentDueDay,
    }

    if ( !data.fareValue ) return walletData

    return {
        ...walletData,
        fareValue: normalizeOptionalMoney(data.fareValue)
    }

}

export const mapToCreatePrismaUser = (data: CreateUserInput) => {

    return {
        name: capitalizar( data.name ),
        nickname: capitalizar( data.nickname ),
        email: data.email.toLocaleLowerCase(),
        password: bcryptjs.hashSync( data.password )
    }

}
