// Enums
export enum WalletType {
    EFECTIVO = 'EFECTIVO',
    CUENTA_BANCARIA = 'CUENTA_BANCARIA',
    AHORROS = 'AHORROS',
    TRANSPORTE = 'TRANSPORTE'
}

export enum TransactionType {
    INGRESO = 'INGRESO',
    GASTO = 'GASTO',
    TRANSPORTE = 'TRANSPORTE',
    TRANSFERENCIA = 'TRANSFERENCIA'
}

// Interfaces
export interface User {
    id: string;
    name: string;
    nickname: string;
    email: string;
    wallets: Wallet[];
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Wallet {
    id: string;
    userId: string;
    user: User;
    name: string;
    balance: number;
    type: WalletType;
    icon: string;
    color: string;
    includeInTotal: boolean;
    fareValue?: number;
    isActive: boolean;
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id: string;
    userId: string;
    user: User;
    walletId: string;
    wallet: Wallet;
    type: TransactionType;
    title: string;
    description: string;
    date: Date;
    categoryId: string;
    category: Category;
    amount: number;
    fareValue?: number;
    numberOfTrips?: number;
    fromWalletId?: string;
    toWalletId?: string;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}

// Input types for creating new entities
export interface CreateUserInput {
    name: string;
    nickname: string;
    email: string;
    password: string;
}

export interface CreateWalletInput {
    userId: string;
    name: string;
    balance: number;
    type: WalletType;
    icon: string;
    color: string;
    includeInTotal: boolean;
    fareValue?: number;
}

export interface CreateTransactionInput {
    userId: string;
    walletId: string;
    type: TransactionType;
    title: string;
    description: string;
    date: Date;
    categoryId: string;
    amount: number;
    fareValue?: number;
    numberOfTrips?: number;
    fromWalletId?: string;
    toWalletId?: string;
}

export interface CreateCategoryInput {
    name: string;
    color: string;
}

// Input types for updating existing entities
export interface UpdateUserInput {
    name?: string;
    nickname?: string;
    email?: string;
    password?: string;
}

export interface UpdateWalletInput {
    name?: string;
    balance?: number;
    type?: WalletType;
    icon?: string;
    color?: string;
    includeInTotal?: boolean;
    fareValue?: number;
    isActive?: boolean;
}

export interface UpdateTransactionInput {
    type?: TransactionType;
    title?: string;
    description?: string;
    date?: Date;
    categoryId?: string;
    amount?: number;
    fareValue?: number;
    numberOfTrips?: number;
    fromWalletId?: string;
    toWalletId?: string;
    isVisible?: boolean;
}

export interface UpdateCategoryInput {
    name?: string;
    color?: string;
}

