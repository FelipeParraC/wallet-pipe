
export interface User {
    id: string
    name: string
    nickname: string
    email: string
    emailVerified?: Date
    image?: string | null
    googleId?: string | null
}

export interface AuthUser {
    id: string
    name: string
    nickname: string
    email: string
    emailVerified: Date
    image?: string | null
    googleId?: string | null
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
