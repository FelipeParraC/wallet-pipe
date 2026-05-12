'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '../ui'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { authenticate } from '@/actions'
import { AuthDivider, AuthShell, BackToOptionsButton, EmailButton, GoogleButton } from './AuthPrimitives'

const formSchema = z.object({
    email: z.string().email({
        message: 'Por favor, introduce un email válido.',
    }),
    password: z.string().min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
})

interface LoginFormProps {
    authError?: string
}

const authErrorMessages: Record<string, string> = {
    AccessDenied: 'No pudimos autorizar el ingreso con Google. Inténtalo de nuevo.',
    CallbackRouteError: 'No pudimos completar el ingreso con Google. Inténtalo de nuevo.',
    DatabaseUnavailable: 'No pudimos conectar con la base de datos. Inténtalo de nuevo en un momento.',
    GoogleEmailMissing: 'Google no compartió un correo válido para crear la cuenta.',
}

export const LoginForm = ({ authError }: LoginFormProps) => {

    const [state, dispatch] = useFormState(authenticate, undefined)
    const [showEmailForm, setShowEmailForm] = useState(false)

    useEffect(() => {
        if ( state === 'Success' ) {
            window.location.replace('/')
        }
    }, [ state ])
    

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    return (
        <AuthShell
            title='Entra a Wallet Pipe'
            subtitle='Elige cómo quieres entrar.'
            footer={(
                <>
                    ¿No tienes una cuenta?{' '}
                    <Link href='/auth/register' className='text-sky-300 hover:underline'>
                        Regístrate
                    </Link>
                </>
            )}
        >
            {!showEmailForm ? (
                <div className='space-y-3'>
                    <GoogleButton />
                    {authError && (
                        <Alert variant='destructive'>
                            <AlertDescription>{authErrorMessages[authError] ?? 'No pudimos iniciar sesión con Google. Inténtalo otra vez.'}</AlertDescription>
                        </Alert>
                    )}
                    <AuthDivider />
                    <EmailButton label='Ingresar con correo' onClick={() => setShowEmailForm(true)} />
                </div>
            ) : (
                <div className='space-y-4'>
                    <BackToOptionsButton onClick={() => setShowEmailForm(false)} />
                    <Form {...form}>
                        <form action={ dispatch } className='space-y-4'>
                            <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input autoFocus inputMode='email' autoComplete='email' placeholder='tu@email.com' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='password'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type='password' autoComplete='current-password' placeholder='••••••' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {state === 'Invalid credentials.' && (
                                <Alert variant='destructive'>
                                    <AlertDescription>Email o contraseña incorrectos.</AlertDescription>
                                </Alert>
                            )}
                            {state === 'Google account.' && (
                                <Alert variant='destructive'>
                                    <AlertDescription>Esta cuenta entra con Google. Usa el botón de Google.</AlertDescription>
                                </Alert>
                            )}
                            {state === 'Auth callback error.' && (
                                <Alert variant='destructive'>
                                    <AlertDescription>No pudimos crear la sesión. Revisa la configuración de Auth.</AlertDescription>
                                </Alert>
                            )}
                            {state === 'Database unavailable.' && (
                                <Alert variant='destructive'>
                                    <AlertDescription>No pudimos conectar con la base de datos. Inténtalo de nuevo en un momento.</AlertDescription>
                                </Alert>
                            )}
                            {state && !['Success', 'Invalid credentials.', 'Google account.', 'Auth callback error.', 'Database unavailable.'].includes(state) && (
                                <Alert variant='destructive'>
                                    <AlertDescription>No pudimos iniciar sesión. Inténtalo otra vez.</AlertDescription>
                                </Alert>
                            )}
                            <LoginButton />
                        </form>
                    </Form>
                </div>
            )}
        </AuthShell>
    )
}

const LoginButton = () => {
    const { pending } = useFormStatus()

    return (
        <Button
            type='submit'
            className='w-full text-white transition-all'
            disabled={ pending }
        >
            {pending ? 'Entrando...' : 'Ingresar'}
        </Button>
    )
}
