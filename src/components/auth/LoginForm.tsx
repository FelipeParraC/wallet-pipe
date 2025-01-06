'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle, Button, Card, CardContent, CardHeader, CardTitle, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input } from '../ui'
import Link from 'next/link'

const formSchema = z.object({
    email: z.string().email({
        message: 'Por favor, introduce un email válido.',
    }),
    password: z.string().min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
})

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null)
        try {
            // Aquí iría la lógica de autenticación
            console.log(values)
            // Si la autenticación es exitosa, redirigir al dashboard
            router.push('/dashboard')
        } catch (error) {
            setError('Error al iniciar sesión. Por favor, verifica tus credenciales.')
        }
    }

    return (
        <Card className='w-full max-w-md mx-auto'>
            <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl text-center'>Iniciar Sesión</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                        {error && (
                            <Alert variant='destructive'>
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type='submit' className='w-full'>
                            Iniciar sesión
                        </Button>
                        <div className='text-center text-sm'>
                            ¿No tienes una cuenta?{' '}
                            <Link href='/auth/register' className='text-primary hover:underline'>
                                Regístrate
                            </Link>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}