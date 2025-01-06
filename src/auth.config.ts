import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import prisma from './lib/prisma'
import bcryptjs from 'bcryptjs'
import { AuthUser, User } from '@/interfaces'

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/auth/login',
        newUser: '/auth/register'
    },
    callbacks: {
        jwt({ token, user }) {
            if ( user ) {
                token.data = user
            }
            return token
        },
        session({ token, session, user }) {
            session.user = token.data as AuthUser
            return session
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if ( !parsedCredentials.success ) return null

                const { email, password } = parsedCredentials.data

                // Buscar por correo
                const userDB = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

                if ( !userDB ) return null

                // Comparar contraseñas
                if ( !bcryptjs.compareSync( password, userDB.password ) ) return null

                // Regresar el usuario sin el password
                const user = {
                    id: userDB.id,
                    email: userDB.email,
                    name: userDB.name,
                    nickname: userDB.nickname
                } as User

                return user
            },
        }),
    ]
}

export const { signIn, signOut, auth, handlers } = NextAuth( authConfig )