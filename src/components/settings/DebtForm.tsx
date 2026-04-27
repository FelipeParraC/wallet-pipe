'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { createDebt } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

const formSchema = z.object({
    personName: z.string().min(1, 'La persona es requerida'),
    title: z.string().min(1, 'El título es requerido'),
    direction: z.enum(['YO_DEBO', 'ME_DEBEN']),
    principalAmount: z.string().min(1, 'El capital inicial es requerido'),
    currentBalance: z.string().min(1, 'El saldo actual es requerido'),
    startedAt: z.string().min(1, 'La fecha es requerida'),
    notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export const DebtForm = () => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            direction: 'YO_DEBO',
            startedAt: new Date().toISOString().slice(0, 16),
        },
    })

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)
        try {
            const response = await createDebt({
                personName: values.personName,
                title: values.title,
                direction: values.direction,
                principalAmount: Number(values.principalAmount),
                currentBalance: Number(values.currentBalance),
                startedAt: values.startedAt,
                notes: values.notes,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            form.reset({
                direction: 'YO_DEBO',
                startedAt: new Date().toISOString().slice(0, 16),
            })
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField control={form.control} name='personName' render={({ field }) => (
                    <FormItem><FormLabel>Persona</FormLabel><FormControl><Input placeholder='Ej. Juan Riaño' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='title' render={({ field }) => (
                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder='Ej. Préstamo portátil' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='direction' render={({ field }) => (
                    <FormItem><FormLabel>Relación</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='YO_DEBO'>Yo debo</SelectItem><SelectItem value='ME_DEBEN'>Me deben</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='principalAmount' render={({ field }) => (
                        <FormItem><FormLabel>Capital inicial</FormLabel><FormControl><Input type='number' step='0.01' placeholder='300000' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='currentBalance' render={({ field }) => (
                        <FormItem><FormLabel>Saldo actual</FormLabel><FormControl><Input type='number' step='0.01' placeholder='180000' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name='startedAt' render={({ field }) => (
                    <FormItem><FormLabel>Fecha de inicio</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='notes' render={({ field }) => (
                    <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea className='min-h-20' placeholder='Opcional' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type='submit' className='w-full'>{isPending ? 'Creando...' : 'Crear deuda'}</Button>
            </form>
        </Form>
    )
}
