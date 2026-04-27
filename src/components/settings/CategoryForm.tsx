'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import type { Category } from '@/interfaces'
import { createCategory } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'

const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    color: z.string().min(1, 'El color es requerido'),
    parentId: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CategoryFormProps {
    categories: Category[]
}

export const CategoryForm = ({ categories }: CategoryFormProps) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            color: '#3b82f6',
        },
    })

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)

        try {
            const response = await createCategory({
                name: values.name,
                color: values.color,
                parentId: values.parentId || undefined,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            form.reset({ name: '', color: '#3b82f6', parentId: undefined })
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
                            <FormLabel>Nueva categoría</FormLabel>
                            <FormControl>
                                <Input placeholder='Ej. Salud' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='parentId'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría padre</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Opcional' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                    {isPending ? 'Creando...' : 'Crear categoría'}
                </Button>
            </form>
        </Form>
    )
}
