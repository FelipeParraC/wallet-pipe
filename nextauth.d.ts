import NextAuth, { DefaultSession } from 'next-auth'


declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name: string
            nickname: string
            email: string
        } & DefaultSession['user']
    }
}