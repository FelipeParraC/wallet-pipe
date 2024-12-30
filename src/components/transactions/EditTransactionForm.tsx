'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormMessage, FormDescription, Textarea, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Popover, PopoverTrigger, PopoverContent, Calendar } from '@/components/ui'
import type { Transaction, UpdateTransactionInput, Wallet } from '@/interfaces'
import { isTransportTransaction, isTransferTransaction } from '@/interfaces'

const editTransactionSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({ required_error: 'La fecha es requerida' }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
    categoryId: z.string().optional(),
    numberOfTrips: z.number().optional(),
    fromWalletId: z.string().optional(),
    toWalletId: z.string().optional(),
})

type EditTransactionFormData = z.infer<typeof editTransactionSchema>

interface EditTransactionFormProps {
    transaction: Transaction
    wallets: Wallet[]
    categories: string[]
}

export const EditTransactionForm = ({ transaction, categories, wallets }: EditTransactionFormProps) => {
    const form = useForm<EditTransactionFormData>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: {
            title: transaction.title,
            description: transaction.description,
            date: parseISO(transaction.date),
            time: format(parseISO(transaction.date), 'HH:mm'),
            amount: Math.abs(transaction.amount),
            categoryId: transaction.category,
            numberOfTrips: isTransportTransaction(transaction) ? transaction.numberOfTrips : undefined,
            fromWalletId: isTransferTransaction(transaction) ? transaction.fromWallet : undefined,
            toWalletId: isTransferTransaction(transaction) ? transaction.toWallet : undefined,
        },
    })

    const onSubmit = (values: EditTransactionFormData) => {
        const combinedDateTime = new Date(values.date)
        const [hours, minutes] = values.time.split(':')
        combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10))

        const updateData: UpdateTransactionInput = {
            title: values.title,
            description: values.description,
            date: combinedDateTime,
            amount: values.amount,
            categoryId: values.categoryId,
            numberOfTrips: values.numberOfTrips,
            fromWalletId: values.fromWalletId,
            toWalletId: values.toWalletId,
        }

        console.log('Updating transaction with data:', updateData)
        //TODO: Call API or handle update logic here
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
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {isTransferTransaction(transaction) && (
                    <>
                        <FormField
                            control={form.control}
                            name="fromWalletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Origen</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14">
                                                <SelectValue placeholder="Selecciona una billetera" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.map((wallet) => (
                                                <SelectItem key={wallet.id} value={wallet.id}>
                                                    {wallet.name}
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
                            name="toWalletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Destino</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14">
                                                <SelectValue placeholder="Selecciona una billetera" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.filter(w => w.id !== form.watch('fromWalletId')).map((wallet) => (
                                                <SelectItem key={wallet.id} value={wallet.id}>
                                                    {wallet.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
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
                <Button type="submit" className="w-full h-14 text-lg">
                    Guardar Cambios
                </Button>
            </form>
        </Form>
    )
}
