'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { UpdateWalletInput, Wallet } from '@/interfaces'
import { Alert, AlertDescription, Form, FormField, FormItem, FormLabel, FormControl, Input, FormDescription, FormMessage, Checkbox, Button } from '@/components/ui'
import { updateWalletById } from '@/actions'
import { useRouter } from 'next/navigation'
import { roundMoney } from '@/lib/finance'

const suggestedColors = [
    '#3b82f6',
    '#22c55e',
    '#ef4444',
    '#f97316',
    '#a855f7',
    '#4b5563',
]

const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    color: z.string().min(1, 'El color es requerido'),
    includeInTotal: z.boolean(),
    fareValue: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Number(val)), { message: 'Debe ser un número válido' }),
    creditLimit: z.string().optional(),
    statementClosingDay: z.string().optional(),
    paymentDueDay: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditWalletFormProps {
    wallet: Wallet
}

export const EditWalletForm = ({ wallet }: EditWalletFormProps) => {

    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: wallet.name,
            color: wallet.color,
            includeInTotal: wallet.includeInTotal,
            fareValue: wallet.type === 'Transporte' && wallet.fareValue ? wallet.fareValue.toString() : '',
            creditLimit: wallet.type === 'Tarjeta de Crédito' && wallet.creditLimit ? wallet.creditLimit.toString() : '',
            statementClosingDay: wallet.type === 'Tarjeta de Crédito' && wallet.statementClosingDay ? wallet.statementClosingDay.toString() : '',
            paymentDueDay: wallet.type === 'Tarjeta de Crédito' && wallet.paymentDueDay ? wallet.paymentDueDay.toString() : '',
        },
    })

    const watchType = wallet.type

    const handleUpdate = async (values: FormData) => {
        setError(null)
        setIsPending(true)
        const updatedData: UpdateWalletInput = {
            name: values.name,
            color: values.color,
            includeInTotal: values.includeInTotal,
            fareValue: values.fareValue ? roundMoney(parseFloat(values.fareValue)) : undefined,
            creditLimit: values.creditLimit ? roundMoney(parseFloat(values.creditLimit)) : undefined,
            statementClosingDay: values.statementClosingDay ? parseInt(values.statementClosingDay, 10) : undefined,
            paymentDueDay: values.paymentDueDay ? parseInt(values.paymentDueDay, 10) : undefined,
        }
        const response = await updateWalletById(updatedData, wallet.id)

        setIsPending(false)

        if (!response.ok) {
            setError(response.message)
            return
        }

        router.push(`/billeteras/${wallet.id}`)
        router.refresh()
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-8'>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Billetera</FormLabel>
                            <FormControl>
                                <Input placeholder='Mi Billetera' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType === 'Transporte' && (
                    <FormField
                        control={form.control}
                        name='fareValue'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor del Pasaje</FormLabel>
                                <FormControl>
                                    <Input type='number' step='0.01' placeholder='0.00' {...field} />
                                </FormControl>
                                <FormDescription>
                                    Ingrese el valor de un pasaje para esta tarjeta de transporte
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name='color'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <div className='flex items-center space-x-2'>
                                    <Input type='color' {...field} className='w-12 h-12 p-1 rounded-md' />
                                    <Input {...field} placeholder='#3b82f6' className='flex-grow' />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Selecciona un color para identificar tu billetera
                            </FormDescription>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                {suggestedColors.map((color) => (
                                    <button
                                        key={color}
                                        type='button'
                                        className='w-8 h-8 rounded-full border border-gray-300'
                                        style={{ backgroundColor: color }}
                                        onClick={() => form.setValue('color', color)}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='includeInTotal'
                    render={({ field }) => (
                        <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    disabled={watchType === 'Tarjeta de Crédito' || watchType === 'Transporte'}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                                <FormLabel>
                                    Incluir en el balance total
                                </FormLabel>
                                <FormDescription>
                                    {watchType === 'Tarjeta de Crédito'
                                        ? 'Las tarjetas se muestran como deuda y no entran directamente al disponible general.'
                                        : watchType === 'Transporte'
                                            ? 'Las tarjetas de transporte permanecen fuera del balance principal.'
                                            : 'Si está marcado, esta cuenta se incluirá en el cálculo del balance total.'}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                {error && (
                    <Alert variant='destructive'>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {watchType === 'Tarjeta de Crédito' && (
                    <div className='grid gap-4'>
                        <div className='rounded-lg border border-violet-500/30 bg-violet-500/10 p-4 text-left'>
                            <p className='text-sm font-medium text-violet-200'>Estado de la tarjeta</p>
                            <p className='mt-1 text-sm text-muted-foreground'>
                                La deuda actual y el cupo disponible se recalculan desde tus compras y pagos. Aquí solo ajustas la configuración base.
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name='creditLimit'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cupo de Crédito</FormLabel>
                                    <FormControl>
                                        <Input type='number' step='0.01' placeholder='0.00' {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Cupo total aprobado por el banco.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='grid grid-cols-2 gap-4'>
                            <FormField
                                control={form.control}
                                name='statementClosingDay'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Día de Corte</FormLabel>
                                        <FormControl>
                                            <Input type='number' min='1' max='31' placeholder='18' {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Día en que se cierra el extracto.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='paymentDueDay'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Día Límite de Pago</FormLabel>
                                        <FormControl>
                                            <Input type='number' min='1' max='31' placeholder='5' {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Día máximo para pagar el corte.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}
                <Button type='submit' className='w-full text-white'>
                    {isPending ? 'Actualizando...' : 'Actualizar Billetera'}
                </Button>
            </form>
        </Form>
    )
}
