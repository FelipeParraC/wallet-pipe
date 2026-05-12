'use server'

import { signIn } from '@/auth.config'
import { AuthError } from 'next-auth'
import bcryptjs from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// ...

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const validateCredentials = async (email: string, password: string) => {
    try {
        const parsedCredentials = credentialsSchema.safeParse({ email, password })

        if (!parsedCredentials.success) {
            return { ok: false as const, message: 'Invalid credentials.' }
        }

        const normalizedEmail = parsedCredentials.data.email.toLowerCase()
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                password: true,
                googleId: true,
            },
        })

        if (!user) return { ok: false as const, message: 'Invalid credentials.' }

        if (!user.password) {
            return {
                ok: false as const,
                message: user.googleId ? 'Google account.' : 'Invalid credentials.',
            }
        }

        if (!bcryptjs.compareSync(parsedCredentials.data.password, user.password)) {
            return { ok: false as const, message: 'Invalid credentials.' }
        }

        return {
            ok: true as const,
            email: normalizedEmail,
            password: parsedCredentials.data.password,
        }
    } catch (error) {
        console.error('validateCredentials', error)
        return { ok: false as const, message: 'Database unavailable.' }
    }
}

export const authenticate = async (
    prevState: string | undefined,
    formData: FormData,
) => {
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')
    const validation = await validateCredentials(email, password)

    if (!validation.ok) {
        return validation.message
    }

    try {
        await signIn('credentials', {
            email: validation.email,
            password: validation.password,
            redirect: false,
        })
        return 'Success'
    } catch (error) {
        console.error('authenticate', error)
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                case 'CallbackRouteError':
                    return 'Auth callback error.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}

export const login = async (email: string, password: string) => {
    const validation = await validateCredentials(email, password)

    if (!validation.ok) {
        return { ok: false, message: validation.message }
    }

    try {
        
        await signIn('credentials', {
            email: validation.email,
            password: validation.password,
            redirect: false,
        })

        return { ok: true }

    } catch ( error ) {
        console.log( error )
        return { ok: false, message: 'No se pudo iniciar sesión' }
    }
}

export const loginWithGoogle = async () => {
    await signIn('google', { redirectTo: '/' })
}
