import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'
import prisma from './lib/prisma'
import bcryptjs from 'bcryptjs'
import { AuthUser, User } from '@/interfaces'

const toAuthUser = (user: {
    id: string
    email: string
    name: string
    nickname: string
    emailVerified: Date
    image?: string | null
    googleId?: string | null
}): AuthUser => ({
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    emailVerified: user.emailVerified,
    image: user.image,
    googleId: user.googleId,
})

export const authConfig: NextAuthConfig = {
    trustHost: true,
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/login',
        newUser: '/auth/register'
    },
    callbacks: {
        async signIn({ account, user }) {
            if (account?.provider !== 'google') return true

            const email = user.email?.toLowerCase()
            if (!email) return false

            const googleId = account.providerAccountId
            const name = user.name?.trim() || email.split('@')[0]
            const image = user.image ?? null
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { googleId },
                    ],
                },
            })

            if (existingUser) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        googleId,
                        image,
                        name,
                        emailVerified: new Date(),
                    },
                })
                return true
            }

            await prisma.user.create({
                data: {
                    email,
                    name,
                    nickname: '',
                    password: null,
                    googleId,
                    image,
                    emailVerified: new Date(),
                },
            })

            return true
        },
        async jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id
            }

            const email = user?.email?.toLowerCase() ?? token.email?.toLowerCase() ?? (token.data as AuthUser | undefined)?.email?.toLowerCase()
            const userId = user?.id ?? token.sub ?? (token.data as AuthUser | undefined)?.id

            if (email) {
                const userDB = await prisma.user.findUnique({ where: { email } })
                if (userDB) {
                    token.data = toAuthUser(userDB)
                }
            } else if (userId) {
                const userDB = await prisma.user.findUnique({ where: { id: userId } })
                if (userDB) {
                    token.data = toAuthUser(userDB)
                }
            } else if (user) {
                token.data = user
            }

            return token
        },
        session({ token, session }) {
            if (token.data) {
                session.user = token.data as AuthUser
            }
            return session
        },
    },
    providers: [
        Google,
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
                if ( !userDB.password || !bcryptjs.compareSync( password, userDB.password ) ) return null

                // Regresar el usuario sin el password
                const user = {
                    id: userDB.id,
                    email: userDB.email,
                    name: userDB.name,
                    nickname: userDB.nickname,
                    image: userDB.image,
                    googleId: userDB.googleId,
                } as User

                return user
            },
        }),
    ]
}

export const { signIn, signOut, auth, handlers } = NextAuth( authConfig )
