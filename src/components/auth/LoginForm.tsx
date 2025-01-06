'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input } from '../ui'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { authenticate } from '@/actions'
import { useEffect } from 'react'

const formSchema = z.object({
    email: z.string().email({
        message: 'Por favor, introduce un email válido.',
    }),
    password: z.string().min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
})

export const LoginForm = () => {

    const [state, dispatch] = useFormState(authenticate, undefined)

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
        <Card className='w-full max-w-md mx-auto'>
            <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl text-center'>Ingresar</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form action={ dispatch } className='space-y-4'>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input autoFocus placeholder='tu@email.com' {...field} />
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
                        {state === 'Invalid credentials.' && (
                            <Alert variant='destructive'>
                                <AlertDescription>Las credenciales no son correctas</AlertDescription>
                            </Alert>
                        )}
                        <LoginButton />
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

const LoginButton = () => {
    const { pending } = useFormStatus()

    return (
        <Button
            type='submit'
            className='w-full text-white transition-all'
            disabled={ pending }
        >
            Ingresar
        </Button>
    )
}