'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import type { Category, CreateTransactionInput, Wallet } from '@/interfaces'
import { Button, Calendar, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../ui'
import { createTransaction } from '@/actions'
import { useRouter } from 'next/navigation'

const standardFormSchema = z.object({
    type: z.enum(['INGRESO', 'GASTO']),
    title: z.string().min(1, 'El título es requerido'),
    amount: z.string().min(1, 'El monto es requerido'),
    wallet: z.string().min(1, 'La billetera es requerida'),
    category: z.string().min(1, 'La categoría es requerida'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({
        required_error: 'La fecha es requerida',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
})

const transportFormSchema = z.object({
    type: z.literal('TRANSPORTE'),
    title: z.string().min(1, 'El título es requerido'),
    numberOfTrips: z.string().min(1, 'El número de viajes es requerido'),
    wallet: z.string().min(1, 'La billetera es requerida'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({
        required_error: 'La fecha es requerida',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
})

const transferFormSchema = z.object({
    type: z.literal('TRANSFERENCIA'),
    title: z.string().min(1, 'El título es requerido'),
    amount: z.string().min(1, 'El monto es requerido'),
    fromWallet: z.string().min(1, 'La billetera de origen es requerida'),
    toWallet: z.string().min(1, 'La billetera de destino es requerida'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({
        required_error: 'La fecha es requerida',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
})

const formSchema = z.discriminatedUnion('type', [
    standardFormSchema,
    transportFormSchema,
    transferFormSchema,
])

type FormData = z.infer<typeof formSchema>

interface CreateTransactionFormProps {
    wallets: Wallet[]
    categories: Category[] | null
    wallet?: Wallet
}

export const CreateTransactionForm = ({ wallets, categories, wallet }: CreateTransactionFormProps) => {

    const router = useRouter()

    const [selectedWalletType, setSelectedWalletType] = useState<string>('')

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'GASTO',
            wallet: wallet?.id || '',
            date: new Date(),
            time: format(new Date(), 'HH:mm'),
        },
    })

    const watchWallet = form.watch('wallet')
    const watchType = form.watch('type')

    useEffect(() => {
        const selectedWallet = wallets.find(w => w.id === watchWallet)
        setSelectedWalletType(selectedWallet?.type || '')
    }, [watchWallet, wallets])

    useEffect(() => {
        if (selectedWalletType === 'Transporte' && watchType !== 'TRANSFERENCIA') {
            form.setValue('type', 'TRANSPORTE')
        } else if (watchType === 'TRANSPORTE' && selectedWalletType !== 'TRANSPORTE') {
            form.setValue('type', 'GASTO')
        }
    }, [selectedWalletType, watchType, form])

    const handleSubmit = async (values: FormData) => {
        const date = Date.parse(format(new Date(values.date), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"))
        if (values.type === 'TRANSPORTE') {
            const fareValue = wallets.find(w => w.id === values.wallet)?.fareValue || 0
            const submissionData: CreateTransactionInput = {
                type: values.type,
                title: values.title,
                description: values.description,
                date: date,
                fareValue: fareValue,
                numberOfTrips: parseInt(values.numberOfTrips),
                categoryId: '02',
                walletId: values.wallet,
                amount: -(fareValue * parseInt(values.numberOfTrips))
            }
            await createTransaction( submissionData )
        } else if (values.type === 'TRANSFERENCIA') {
            const submissionData: CreateTransactionInput = {
                type: values.type,
                title: values.title,
                description: values.description,
                date: date,
                amount: -Math.abs(parseFloat(values.amount)),
                categoryId: '11',
                fromWalletId: values.fromWallet,
                toWalletId: values.toWallet,
                walletId: values.fromWallet
            }
            await createTransaction(submissionData)
        } else if ( categories ) {
            const submissionData: CreateTransactionInput = {
                type: values.type,
                title: values.title,
                description: values.description,
                date: date,
                amount: parseFloat(values.amount) * (values.type === 'GASTO' ? -1 : 1),
                categoryId: categories.find( c => c.name === values.category )?.id || '10',
                walletId: values.wallet
            }
            await createTransaction(submissionData)
        }

        router.push( wallet ? `/billeteras/${ wallet.id }` : '/transacciones' )
        router.refresh()
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
                <FormField
                    control={form.control}
                    name='type'
                    render={({ field }) => (
                        <FormItem className='space-y-3'>
                            <FormLabel>Tipo de Transacción</FormLabel>
                            <FormControl>
                                <div className='flex flex-wrap gap-4'>
                                    {(selectedWalletType === 'Transporte' ? ['TRANSPORTE'] : ['GASTO', 'INGRESO', 'TRANSFERENCIA']).map((type) => (
                                        <Button
                                            key={type}
                                            type='button'
                                            variant={field.value === type ? 'default' : 'outline'}
                                            className='flex-1'
                                            onClick={() => field.onChange(type)}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Button>
                                    ))}

                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType !== 'TRANSFERENCIA' && (
                    <FormField
                        control={form.control}
                        name='wallet'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billetera</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='h-14'>
                                            <SelectValue placeholder='Selecciona una billetera' />
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
                )}
                <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder='Título de la transacción' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType === 'TRANSPORTE' ? (
                    <FormField
                        control={form.control}
                        name='numberOfTrips'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Viajes</FormLabel>
                                <FormControl>
                                    <Input
                                        type='number'
                                        placeholder='0'
                                        {...field}
                                        className='text-3xl h-16 text-center font-bold'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name='amount'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder='0.00'
                                        {...field}
                                        className='text-3xl h-16 text-center font-bold'
                                        type='number'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {watchType === 'TRANSFERENCIA' && (
                    <>
                        <FormField
                            control={form.control}
                            name='fromWallet'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Origen</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='h-14'>
                                                <SelectValue placeholder='Selecciona una billetera' />
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
                            name='toWallet'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Destino</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='h-14'>
                                                <SelectValue placeholder='Selecciona una billetera' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.filter(w => w.id !== form.watch('fromWallet')).map((wallet) => (
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
                {watchType !== 'TRANSFERENCIA' && watchType !== 'TRANSPORTE' && (
                    <FormField
                        control={form.control}
                        name='category'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='h-14'>
                                            <SelectValue placeholder='Selecciona una categoría' />
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
                    name='description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder='Breve descripción de la transacción'
                                    className='resize-none h-24'
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
                <div className='flex space-x-4'>
                    <FormField
                        control={form.control}
                        name='date'
                        render={({ field }) => (
                            <FormItem className='flex-1'>
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={`w-full h-14 pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Selecciona una fecha</span>
                                                )}
                                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                        <Calendar
                                            mode='single'
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
                        name='time'
                        render={({ field }) => (
                            <FormItem className='flex-1'>
                                <FormLabel>Hora</FormLabel>
                                <FormControl>
                                    <div className='relative'>
                                        <Input
                                            type='time'
                                            {...field}
                                            className='h-14 pl-10'
                                        />
                                        <Clock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type='submit' className='w-full h-14 text-lg'>
                    Guardar Transacción
                </Button>
            </form>
        </Form>
    )
}

