export interface Tag {
    id: string
    userId: string
    name: string
    color?: string
}

export interface CreateTagInput {
    name: string
    color?: string
}
