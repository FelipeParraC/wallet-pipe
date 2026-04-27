'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import { Alert, AlertDescription, Form, FormField, FormItem, FormLabel, FormControl, Input, FormMessage, FormDescription, Textarea, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Popover, PopoverTrigger, PopoverContent, Calendar } from '@/components/ui'
import type { Category, Transaction, UpdateTransactionInput } from '@/interfaces'
import { isTransportTransaction, isTransferTransaction } from '@/interfaces'
import { updateTransactionById } from '@/actions'
import { useRouter } from 'next/navigation'
import { combineDateAndTime, roundMoney, toSignedAmount, toTransferAmount } from '@/lib/finance'

const editTransactionSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({ required_error: 'La fecha es requerida' }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido'),
    amount: z.string().min(0, 'El monto debe ser mayor o igual a 0'),
    categoryId: z.string().optional(),
    numberOfTrips: z.string().optional(),
})

type EditTransactionFormData = z.infer<typeof editTransactionSchema>

interface EditTransactionFormProps {
    transaction: Transaction
    categories: Category[] | null
    walletId: string
}

export const EditTransactionForm = ({ transaction, categories, walletId }: EditTransactionFormProps) => {

    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<EditTransactionFormData>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: {
            title: transaction.title,
            description: transaction.description,
            date: parseISO(transaction.occurredAt || transaction.date),
            time: format(parseISO(transaction.occurredAt || transaction.date), 'HH:mm:ss'),
            amount: Math.abs(transaction.amount).toString(),
            categoryId: categories ? categories.find( c => c.id === transaction.categoryId )?.name || 'Otros' : 'Otros',
            numberOfTrips: isTransportTransaction(transaction) ? transaction.numberOfTrips.toString() : undefined,
        },
    })

    const onSubmit = async (values: EditTransactionFormData) => {
        setError(null)
        setIsPending(true)
        const date = combineDateAndTime(values.date, values.time)

        const updateData: UpdateTransactionInput = {
            title: values.title,
            description: values.description,
            date: date,
            categoryId: categories ? categories.find( c => c.name === values.categoryId )?.id || categories.find(c => c.name === 'Otros')?.id : undefined,
            newAmount: toSignedAmount(transaction.type, parseFloat(values.amount)),
            numberOfTrips: parseInt(values.numberOfTrips || '0'),
            walletId: transaction.walletId,
            type: transaction.type,
            amount: transaction.amount,
        }

        try {
            let response

        if ( transaction.type !== 'TRANSFERENCIA' && transaction.type !== 'PAGO_TARJETA' ) {
                if ( transaction.fareValue && values.numberOfTrips ) {
                    const updateTransportData: UpdateTransactionInput = {
                        ...updateData,
                        fareValue: transaction.fareValue,
                        newAmount: toSignedAmount('TRANSPORTE', roundMoney(transaction.fareValue * parseInt(values.numberOfTrips, 10)))
                    }
                    response = await updateTransactionById( updateTransportData, transaction.id )
                } else {
                    response = await updateTransactionById( updateData, transaction.id )
                }
        } else {
            const updateTransferData: UpdateTransactionInput = {
                ...updateData,
                amount: toTransferAmount(transaction.amount),
                newAmount: toTransferAmount(parseFloat(values.amount)),
                fromWalletId: transaction.fromWalletId,
                toWalletId: transaction.toWalletId,
            }
            response = await updateTransactionById( updateTransferData, transaction.id )
            }

            if (!response?.ok) {
                setError(response?.message || 'No se pudo actualizar la transacción')
                return
            }

            router.push( walletId ? `/billeteras/${ transaction.walletId }` : '/transacciones' )
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Título de la transacción" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {isTransportTransaction(transaction) && (
                    <FormField
                        control={form.control}
                        name="numberOfTrips"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Viajes</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="1"
                                        {...field}
                                        className="text-3xl h-16 text-center font-bold"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {!isTransportTransaction(transaction) && (
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0.00"
                                        {...field}
                                        className="text-3xl h-16 text-center font-bold"
                                        type="number"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {!isTransferTransaction(transaction) && !isTransportTransaction(transaction) && (
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories ? categories.map((category) => (
                                            <SelectItem key={ category.id } value={ category.name }>
                                                { category.name }
                                            </SelectItem>
                                        )) : <></>}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Breve descripción de la transacción"
                                    className="resize-none h-24"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Máximo 100 caracteres.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex space-x-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={`w-full h-14 pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Selecciona una fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Hora</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            step='1'
                                            {...field}
                                            className="h-14 pl-10"
                                        />
                                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {error && (
                    <Alert variant='destructive'>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" className="w-full h-14 text-lg">
                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </form>
        </Form>
    )
}
