'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle, Button, Card, CardContent, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '../ui'

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
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null)
        try {
            // Aquí iría la lógica de registro
            console.log(values)
            // Si el registro es exitoso, redirigir al dashboard
            router.push('/dashboard')
        } catch (error) {
            setError('Error al registrar. Por favor, inténtalo de nuevo.')
        }
    }

    return (
        <Card className='w-full max-w-md mx-auto'>
            <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl text-center'>Regístrate</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Tu nombre' {...field} />
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
                                        <Input placeholder='Tu apodo' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder='tu@email.com' {...field} />
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
                                        <Input type='password' placeholder='••••••' {...field} />
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
                                    <FormLabel>Confirmar Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type='password' placeholder='••••••' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && (
                            <Alert variant='destructive'>
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type='submit' className='w-full'>
                            Registrarse
                        </Button>
                        <div className='text-center text-sm'>
                            ¿Ya tienes una cuenta?{' '}
                            <Link href='/auth/login' className='text-primary hover:underline'>
                                Inicia sesión
                            </Link>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

