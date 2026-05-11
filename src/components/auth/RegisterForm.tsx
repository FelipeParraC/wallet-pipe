'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '../ui'
import { login, register } from '@/actions'
import { AuthDivider, AuthShell, BackToOptionsButton, EmailButton, GoogleButton } from './AuthPrimitives'

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'El nombre debe tener al menos 2 caracteres.',
    }),
    nickname: z.string().min(2, {
        message: 'El apodo debe tener al menos 2 caracteres.',
    }),
    email: z.string().email({
        message: 'Por favor, introduce un email válido.',
    }),
    password: z.string().min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

export function RegisterForm() {
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'options' | 'email'>('options')
    const [step, setStep] = useState<1 | 2>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            nickname: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const goToProfileStep = async () => {
        setError(null)
        const isValid = await form.trigger(['email', 'password', 'confirmPassword'])
        if (isValid) setStep(2)
    }

    const backToOptions = () => {
        setMode('options')
        setStep(1)
        setError(null)
        form.clearErrors()
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null)
        setIsSubmitting(true)

        const { name, nickname, email, password } = values
        try {
            const resp = await register({ name, nickname, email, password })

            if ( !resp.ok ) {
                setError( resp.message )
                return
            }

            await login( email.toLowerCase(), password )
            window.location.replace('/')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthShell
            title='Crea tu cuenta'
            subtitle='Elige cómo quieres empezar.'
            footer={(
                <>
                    ¿Ya tienes una cuenta?{' '}
                    <Link href='/auth/login' className='text-sky-300 hover:underline'>
                        Inicia sesión
                    </Link>
                </>
            )}
        >
            {mode === 'options' ? (
                <div className='space-y-3'>
                    <GoogleButton />
                    <AuthDivider />
                    <EmailButton label='Continuar con correo' onClick={() => setMode('email')} />
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between gap-3'>
                        <BackToOptionsButton onClick={step === 1 ? backToOptions : () => setStep(1)} />
                        <span className='text-xs font-medium text-slate-500'>Paso {step} de 2</span>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                            {step === 1 ? (
                                <>
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
                                                    <Input type='password' autoComplete='new-password' placeholder='••••••' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='confirmPassword'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirmar contraseña</FormLabel>
                                                <FormControl>
                                                    <Input type='password' autoComplete='new-password' placeholder='••••••' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type='button' className='w-full' onClick={goToProfileStep}>
                                        Continuar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <FormField
                                        control={form.control}
                                        name='name'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <FormControl>
                                                    <Input autoFocus autoComplete='name' placeholder='Tu nombre' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='nickname'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Apodo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder='Ej. Pipe' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <p className='text-xs text-slate-500'>Usaremos tu apodo para saludarte en el dashboard.</p>
                                    {error && (
                                        <Alert variant='destructive'>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <Button type='submit' className='w-full' disabled={isSubmitting}>
                                        {isSubmitting ? 'Creando...' : 'Crear cuenta'}
                                    </Button>
                                </>
                            )}
                        </form>
                    </Form>
                </div>
            )}
        </AuthShell>
    )
}

