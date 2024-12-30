import { Transaction } from './transaction.interface'
import { Wallet } from './wallet.interface'

export interface User {
    id: string
    name: string
    nickname: string
    email: string
    wallets: Wallet[]
    transactions: Transaction[]
    createdAt: string
    updatedAt: string
}

export interface CreateUserInput {
    name: string
    nickname: string
    email: string
    password: string
}

export interface UpdateUserInput {
    name?: string
    nickname?: string
    email?: string
    password?: string
}