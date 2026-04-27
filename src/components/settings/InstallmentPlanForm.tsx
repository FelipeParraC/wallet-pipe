'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import type { Category, Wallet } from '@/interfaces'
import { createInstallmentPlan } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

const formSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    merchant: z.string().optional(),
    categoryId: z.string().optional(),
    chargeWalletId: z.string().optional(),
    paymentWalletId: z.string().optional(),
    totalAmount: z.string().min(1, 'El total es requerido'),
    installmentAmount: z.string().min(1, 'La cuota es requerida'),
    totalInstallments: z.string().min(1, 'Las cuotas son requeridas'),
    occurredAt: z.string().min(1, 'La fecha de compra es requerida'),
    firstDueAt: z.string().min(1, 'La primera cuota es requerida'),
})

type FormData = z.infer<typeof formSchema>

interface InstallmentPlanFormProps {
    categories: Category[]
    wallets: Wallet[]
}

export const InstallmentPlanForm = ({ categories, wallets }: InstallmentPlanFormProps) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            occurredAt: new Date().toISOString().slice(0, 16),
            firstDueAt: new Date().toISOString().slice(0, 16),
        },
    })

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)
        try {
            const response = await createInstallmentPlan({
                title: values.title,
                description: values.description,
                merchant: values.merchant,
                categoryId: values.categoryId || undefined,
                chargeWalletId: values.chargeWalletId || undefined,
                paymentWalletId: values.paymentWalletId || undefined,
                totalAmount: Number(values.totalAmount),
                installmentAmount: Number(values.installmentAmount),
                totalInstallments: Number(values.totalInstallments),
                occurredAt: values.occurredAt,
                firstDueAt: values.firstDueAt,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            form.reset({
                occurredAt: new Date().toISOString().slice(0, 16),
                firstDueAt: new Date().toISOString().slice(0, 16),
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
                    <FormItem><FormLabel>Compra</FormLabel><FormControl><Input placeholder='Ej. Portátil Asus' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='description' render={({ field }) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea className='min-h-20' placeholder='Detalle opcional' {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='merchant' render={({ field }) => (
                        <FormItem><FormLabel>Comercio</FormLabel><FormControl><Input placeholder='Ktronix' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='categoryId' render={({ field }) => (
                        <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Opcional' /></SelectTrigger></FormControl><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='chargeWalletId' render={({ field }) => (
                        <FormItem><FormLabel>Cuenta o tarjeta de compra</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Opcional' /></SelectTrigger></FormControl><SelectContent>{wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='paymentWalletId' render={({ field }) => (
                        <FormItem><FormLabel>Cuenta de pago</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Opcional' /></SelectTrigger></FormControl><SelectContent>{wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <div className='grid gap-4 md:grid-cols-3'>
                    <FormField control={form.control} name='totalAmount' render={({ field }) => (
                        <FormItem><FormLabel>Total</FormLabel><FormControl><Input type='number' step='0.01' placeholder='2400000' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='installmentAmount' render={({ field }) => (
                        <FormItem><FormLabel>Valor de cuota</FormLabel><FormControl><Input type='number' step='0.01' placeholder='400000' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='totalInstallments' render={({ field }) => (
                        <FormItem><FormLabel>Número de cuotas</FormLabel><FormControl><Input type='number' min='1' placeholder='6' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                    <FormField control={form.control} name='occurredAt' render={({ field }) => (
                        <FormItem><FormLabel>Fecha de compra</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name='firstDueAt' render={({ field }) => (
                        <FormItem><FormLabel>Primera cuota</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type='submit' className='w-full'>{isPending ? 'Creando...' : 'Crear compra a cuotas'}</Button>
            </form>
        </Form>
    )
}
