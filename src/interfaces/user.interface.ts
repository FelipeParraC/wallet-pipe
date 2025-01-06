
export interface User {
    id: string
    name: string
    nickname: string
    email: string
    emailVerified?: Date
}

export interface AuthUser {
    id: string
    name: string
    nickname: string
    email: string
    emailVerified: Date
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