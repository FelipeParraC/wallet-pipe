export interface Category {
    id: string
    userId?: string | null
    name: string
    color: string
    parentId?: string | null
    isSystem?: boolean
}

export interface CreateCategoryInput {
    name: string
    color: string
}

export interface UpdateCategoryInput {
    name?: string
    color?: string
}
