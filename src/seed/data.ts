import type { Category, Transaction, User, Wallet } from '@/interfaces'
import { format } from 'date-fns'


export const initialTransactions: Transaction[] = [
    // {
    //     id: 101,
    //     userId: '1',
    //     type: 'GASTO',
    //     walletId: '1',
    //     title: 'Ejemplo Estándar',
    //     description: 'Ejemplo de transacción estándar',
    //     date: format(new Date('2024-12-26T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -10000,
    //     categoryId: '01',
    //     isVisible: true
    // },
    // {
    //     id: 102,
    //     userId: '1',
    //     type: 'TRANSFERENCIA',
    //     walletId: '1',
    //     title: 'Ejemplo Transferencia',
    //     description: 'Ejemplo de transferencia de Efectivo a Falabella',
    //     date: format(new Date('2024-12-22T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: 10000,
    //     categoryId: '11',
    //     fromWallet: '1',
    //     toWallet: '2',
    //     isVisible: true
    // },
    // {
    //     id: 103,
    //     userId: '1',
    //     type: 'TRANSPORTE',
    //     walletId: '5',
    //     title: 'Ejemplo Transporte',
    //     description: 'Ejemplo transacción de transporte',
    //     date: format(new Date('2024-12-23T21:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -2950,
    //     fareValue: 2950,
    //     numberOfTrips: 1,
    //     categoryId: '02',
    //     isVisible: true
    // },
    // {
    //     id: '1006',
    //     userId: '1',
    //     type: 'GASTO',
    //     walletId: '2',
    //     title: 'Gemas Duolingo',
    //     description: '100 gemas de Duolingo',
    //     date: format(new Date('2024-12-29T03:20:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -2900,
    //     categoryId: '08',
    //     isVisible: true
    // },
    // {
    //     id: '1005',
    //     userId: '1',
    //     type: 'GASTO',
    //     walletId: '2',
    //     title: 'Compra v0',
    //     description: 'Mensualidad de v0',
    //     date: format(new Date('2024-12-26T22:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -89371.18,
    //     categoryId: '07',
    //     isVisible: true
    // },
    // {
    //     id: '1004',
    //     userId: '1',
    //     type: 'GASTO',
    //     walletId: '2',
    //     title: 'Hamburguesa Magic',
    //     description: 'Combo de hamburguesa con tocineta en Magic',
    //     date: format(new Date('2024-12-26T17:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -23500,
    //     categoryId: '01',
    //     isVisible: true
    // },
    // {
    //     id: '1003',
    //     userId: '1',
    //     type: 'TRANSFERENCIA',
    //     walletId: '2',
    //     title: 'Gym Riaño',
    //     description: 'Pagué con Falabella y me dio en Efectivo',
    //     date: format(new Date('2024-12-26T15:30:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: 80000,
    //     categoryId: '11',
    //     fromWalletId: '2',
    //     toWalletId: '1',
    //     isVisible: true
    // },
    // {
    //     id: '1002',
    //     userId: '1',
    //     type: 'INGRESO',
    //     walletId: '2',
    //     title: 'Primer Sueldo',
    //     description: 'Mi primer sueldo',
    //     date: format(new Date('2024-12-24T14:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: 1527561,
    //     categoryId: '05',
    //     isVisible: true
    // },
    // {
    //     id: '1001',
    //     userId: '1',
    //     type: 'TRANSPORTE',
    //     walletId: '5',
    //     title: 'Ida Trabajo',
    //     description: 'Pasaje de ida hacia el Trabajo',
    //     date: format(new Date('2024-12-24T07:28:50'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    //     amount: -2950,
    //     fareValue: 2950,
    //     numberOfTrips: 1,
    //     categoryId: '02',
    //     isVisible: true
    // },
    {
        id: '1',
        userId: '1',
        type: 'INGRESO',
        walletId: '1',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 60000,
        categoryId: '10',
        isVisible: false
    },
    {
        id: '2',
        userId: '1',
        type: 'INGRESO',
        walletId: '2',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 91967.90,
        categoryId: '10',
        isVisible: false
    },
    {
        id: '3',
        userId: '1',
        type: 'INGRESO',
        walletId: '3',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 132515.70,
        categoryId: '10',
        isVisible: false
    },
    {
        id: '4',
        userId: '1',
        type: 'INGRESO',
        walletId: '4',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 0.22,
        categoryId: '10',
        isVisible: false
    },
    {
        id: '5',
        userId: '1',
        type: 'INGRESO',
        walletId: '5',
        title: '',
        description: '',
        date: format(new Date('2024-12-23T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        amount: 37400.00,
        categoryId: '10',
        isVisible: false
    },
]

export const wallets: Wallet[] = [
    {
        id: '1',
        userId: '1',
        name: 'Efectivo',
        balance: 60000,    // 140000
        type: 'Efectivo',
        color: '#22c55e',
        includeInTotal: true,
        isActive: true
    },
    {
        id: '2',
        userId: '1',
        name: 'Falabella',
        balance: 91967.90,    // 1423757.72
        type: 'Cuenta Bancaria',
        color: '#4b5563',
        includeInTotal: true,
        isActive: true
    },
    {
        id: '3',
        userId: '1',
        name: 'Nequi',
        balance: 132515.70,     // 132515.70
        type: 'Ahorros',
        color: '#a855f7',
        includeInTotal: true,
        isActive: true
    },
    {
        id: '4',
        userId: '1',
        name: 'DaviPlata',
        balance: 0.22,  // 0.22
        type: 'Ahorros',
        color: '#ef4444',
        includeInTotal: true,
        isActive: true
    },
    {
        id: '5',
        userId: '1',
        name: 'SITP',
        balance: 37400.00,      // 34450
        type: 'Transporte',
        color: '#3b82f6',
        includeInTotal: false,
        isActive: true,
        fareValue: 2950
    }
]

export const currentUser: User = {
    id: '1',
    name: 'Felipe',
    nickname: 'Pipe',
    email: 'felipe@correo.com'
}

export const categories: Category[] = [
    { id: '01', name: 'Alimentación', color: '#ADD8E6' },
    { id: '02', name: 'Transporte', color: '#87CEFA' },
    { id: '03', name: 'Vivienda', color: '#87CEEB' },
    { id: '04', name: 'Entretenimiento', color: '#6495ED' },
    { id: '05', name: 'Sueldo', color: '#B0C4DE' },
    { id: '06', name: 'Salud', color: '#3D59AB' },
    { id: '07', name: 'Tecnología', color: '#4169E1' },
    { id: '08', name: 'Educación', color: '#7DF9FF' },
    { id: '09', name: 'Ropa', color: '#2A52BE' },
    { id: '10', name: 'Otros', color: '#191970' },
    { id: '11', name: 'Transferencia', color: '#4682B4' },
    { id: '12', name: 'Intereses', color: '#708090' },
]

export const initialData = {
    transactions: initialTransactions,
    wallets,
    user: currentUser,
    categories
}