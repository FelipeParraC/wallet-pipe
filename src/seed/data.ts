import { BaseTransaction, Transaction, TransferTransaction } from '@/types/transaction'
import { Wallet } from '@/types/wallet'
import { User } from '@/types/user'
import { Coins, CreditCard, WalletIcon, Bus } from 'lucide-react'
import { format } from 'date-fns'

export const currentUser: User = {
    id: '1',
    name: 'Felipe',
    nickname: 'Pipe',
    email: 'prueba@example.com'
}

export const initialTransactions: Transaction[] = [
    // {
    //     id: 101,
    //     userId: currentUser.id,
    //     wallet: '1',
    //     title: 'Ejemplo Estándar',
    //     description: 'Ejemplo de transacción estándar',
    //     date: format(new Date('2024-12-26T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -10000,
    //     category: 'Alimentación',
    //     isVisible: true
    // } as BaseTransaction,
    // {
    //     id: 102,
    //     userId: currentUser.id,
    //     wallet: '1',
    //     title: 'Ejemplo Transferencia',
    //     description: 'Ejemplo de transferencia de Efectivo a Falabella',
    //     date: format(new Date('2024-12-22T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: 10000,
    //     category: 'Transferencia',
    //     fromWallet: '1',
    //     toWallet: '2',
    //     isVisible: true
    // } as TransferTransaction,
    // {
    //     id: 103,
    //     userId: currentUser.id,
    //     wallet: '5',
    //     title: 'Ejemplo Transporte',
    //     description: 'Ejemplo transacción de transporte',
    //     date: format(new Date('2024-12-23T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -2950,
    //     fareValue: 2950,
    //     numberOfTrips: 1,
    //     category: 'Transporte',
    //     isVisible: true
    // } as TransportTransaction,
    {
        id: 1004,
        userId: currentUser.id,
        wallet: '2',
        title: 'Compra v0',
        description: 'Mensualidad de v0',
        date: format(new Date('2024-12-26T22:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: -89371.18,
        category: 'Tecnología',
        isVisible: true
    } as BaseTransaction,
    {
        id: 1003,
        userId: currentUser.id,
        wallet: '2',
        title: 'Hamburguesa Magic',
        description: 'Combo de hamburguesa con tocineta en Magic',
        date: format(new Date('2024-12-26T17:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: -23500,
        category: 'Alimentación',
        isVisible: true
    } as BaseTransaction,
    {
        id: 1002,
        userId: currentUser.id,
        wallet: '2',
        title: 'Gym Riaño',
        description: 'Pagué con Falabella y me dio en Efectivo',
        date: format(new Date('2024-12-26T15:30:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 80000,
        category: 'Transferencia',
        fromWallet: '2',
        toWallet: '1',
        isVisible: true
    } as TransferTransaction,
    {
        id: 1001,
        userId: currentUser.id,
        wallet: '2',
        title: 'Primer Sueldo',
        description: 'Mi primer sueldo',
        date: format(new Date('2024-12-24T14:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 1527561,
        category: 'Sueldo',
        isVisible: true
    } as BaseTransaction,
    {
        id: 1,
        userId: currentUser.id,
        wallet: '1',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 60000,
        category: '',
        isVisible: false
    } as BaseTransaction,
    {
        id: 2,
        userId: currentUser.id,
        wallet: '2',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 91967.90,
        category: '',
        isVisible: false
    } as BaseTransaction,
    {
        id: 3,
        userId: currentUser.id,
        wallet: '3',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 132515.70,
        category: '',
        isVisible: false
    } as BaseTransaction,
    {
        id: 4,
        userId: currentUser.id,
        wallet: '4',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 0.22,
        category: '',
        isVisible: false
    } as BaseTransaction,
    {
        id: 5,
        userId: currentUser.id,
        wallet: '5',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 34450.00,
        category: '',
        isVisible: false
    } as BaseTransaction,
]

export const wallets: Wallet[] = [
    {
        id: '1',
        userId: currentUser.id,
        name: 'Efectivo',
        balance: 140000,
        type: 'Efectivo',
        icon: Coins,
        color: '#22c55e',
        includeInTotal: true
    },
    {
        id: '2',
        userId: currentUser.id,
        name: 'Falabella',
        balance: 1426657.72,
        type: 'Cuenta Bancaria',
        icon: CreditCard,
        color: '#4b5563',
        includeInTotal: true
    },
    {
        id: '3',
        userId: currentUser.id,
        name: 'Nequi',
        balance: 132515.70,
        type: 'Ahorros',
        icon: WalletIcon,
        color: '#a855f7',
        includeInTotal: true
    },
    {
        id: '4',
        userId: currentUser.id,
        name: 'DaviPlata',
        balance: 0.22,
        type: 'Ahorros',
        icon: WalletIcon,
        color: '#ef4444',
        includeInTotal: true
    },
    {
        id: '5',
        userId: currentUser.id,
        name: 'SITP',
        balance: 34450,
        type: 'Transporte',
        icon: Bus,
        color: '#3b82f6',
        includeInTotal: false,
        fareValue: 2950
    }
]

export const categories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Entretenimiento',
    'Sueldo',
    'Salud',
    'Tecnología',
    'Educación',
    'Ropa',
    'Otros',
    'Transferencia'
]

