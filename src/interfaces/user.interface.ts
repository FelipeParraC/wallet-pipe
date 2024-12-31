
export interface User {
    id: string
    name: string
    nickname: string
    email: string
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
    password?: string
}