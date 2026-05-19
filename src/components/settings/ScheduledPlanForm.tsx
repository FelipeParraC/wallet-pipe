'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import type { Category, Wallet } from '@/interfaces'
import { createScheduledPlan } from '@/actions'
import { Alert, AlertDescription, Button, Checkbox, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

const formSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    kind: z.enum(['SUSCRIPCION', 'SERVICIO', 'PAGO_PROGRAMADO']),
    amountMode: z.enum(['FIJO', 'VARIABLE']),
    fixedAmount: z.string().optional(),
    frequency: z.enum(['DIARIA', 'SEMANAL', 'MENSUAL', 'ANUAL']),
    dueDay: z.string().optional(),
    startsAt: z.string().min(1, 'La fecha inicial es requerida'),
    categoryId: z.string().optional(),
    sourceWalletId: z.string().optional(),
    affectsProjectedBudget: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

interface ScheduledPlanFormProps {
    categories: Category[]
    wallets: Wallet[]
}

export const ScheduledPlanForm = ({ categories, wallets }: ScheduledPlanFormProps) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            kind: 'SUSCRIPCION',
            amountMode: 'FIJO',
            frequency: 'MENSUAL',
            startsAt: new Date().toISOString().slice(0, 16),
            affectsProjectedBudget: true,
        },
    })

    const amountMode = form.watch('amountMode')

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)

        try {
            const response = await createScheduledPlan({
                title: values.title,
                description: values.description,
                kind: values.kind,
                amountMode: values.amountMode,
                fixedAmount: values.amountMode === 'FIJO' && values.fixedAmount ? Number(values.fixedAmount) : undefined,
                frequency: values.frequency,
                dueDay: values.dueDay ? Number(values.dueDay) : undefined,
                startsAt: values.startsAt,
                categoryId: values.categoryId || undefined,
                sourceWalletId: values.sourceWalletId || undefined,
                affectsProjectedBudget: values.affectsProjectedBudget,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            form.reset({
                kind: 'SUSCRIPCION',
                amountMode: 'FIJO',
                frequency: 'MENSUAL',
                startsAt: new Date().toISOString().slice(0, 16),
                affectsProjectedBudget: true,
            })
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField control={form.control} name='title' render={({ field }) => (
                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder='Ej. Spotify' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='description' render={({ field }) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea className='min-h-20' placeholder='Qué representa este pago' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='kind' render={({ field }) => (
                        <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='SUSCRIPCION'>Suscripción</SelectItem><SelectItem value='SERVICIO'>Servicio</SelectItem><SelectItem value='PAGO_PROGRAMADO'>Pago programado</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='frequency' render={({ field }) => (
                        <FormItem><FormLabel>Frecuencia</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='DIARIA'>Diaria</SelectItem><SelectItem value='SEMANAL'>Semanal</SelectItem><SelectItem value='MENSUAL'>Mensual</SelectItem><SelectItem value='ANUAL'>Anual</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='amountMode' render={({ field }) => (
                        <FormItem><FormLabel>Monto</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='FIJO'>Fijo</SelectItem><SelectItem value='VARIABLE'>Variable</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='dueDay' render={({ field }) => (
                        <FormItem><FormLabel>Día de vencimiento</FormLabel><FormControl><Input type='number' min='1' max='31' placeholder='24' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                {amountMode === 'FIJO' && (
                    <FormField control={form.control} name='fixedAmount' render={({ field }) => (
                        <FormItem><FormLabel>Monto base</FormLabel><FormControl><Input type='number' step='0.01' placeholder='38900' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='startsAt' render={({ field }) => (
                        <FormItem><FormLabel>Empieza en</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='sourceWalletId' render={({ field }) => (
                        <FormItem><FormLabel>Cuenta donde se cobra</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Opcional' /></SelectTrigger></FormControl><SelectContent>{wallets.filter((wallet) => wallet.type !== 'Transporte').map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name='categoryId' render={({ field }) => (
                    <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Opcional' /></SelectTrigger></FormControl><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='affectsProjectedBudget' render={({ field }) => (
                    <FormItem className='flex flex-row items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4'><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div><FormLabel>Contar en el proyectado</FormLabel></div></FormItem>
                )} />
                {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type='submit' className='w-full'>{isPending ? 'Creando...' : 'Crear pago programado'}</Button>
            </form>
        </Form>
    )
}
