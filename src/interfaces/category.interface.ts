import type { Transaction } from './transaction.interface'

export interface Category {
    id: string
    name: string
    color: string
    createdAt: Date
    updatedAt: Date
}

export interface CreateCategoryInput {
    name: string
    color: string
}

export interface UpdateCategoryInput {
    name?: string
    color?: string
}