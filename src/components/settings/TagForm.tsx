'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { createTag } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components/ui'

const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    color: z.string().min(1, 'El color es requerido'),
})

type FormData = z.infer<typeof formSchema>

export const TagForm = () => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            color: '#10b981',
        },
    })

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)

        try {
            const response = await createTag({
                name: values.name,
                color: values.color,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            form.reset({ name: '', color: '#10b981' })
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nuevo tag</FormLabel>
                            <FormControl>
                                <Input placeholder='Ej. hogar' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='color'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <Input type='color' {...field} className='h-12 w-20 p-1' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <Alert variant='destructive'>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button type='submit' className='w-full'>
                    {isPending ? 'Creando...' : 'Crear tag'}
                </Button>
            </form>
        </Form>
    )
}
