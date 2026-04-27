'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import type { Category, CreateTransactionInput, Wallet } from '@/interfaces'
import { Alert, AlertDescription, Button, Calendar, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../ui'
import { createTransaction } from '@/actions'
import { useRouter } from 'next/navigation'
import { combineDateAndTime, roundMoney, toSignedAmount, toTransferAmount } from '@/lib/finance'

const standardFormSchema = z.object({
    type: z.enum(['INGRESO', 'GASTO', 'TARJETA_CONSUMO']),
    title: z.string().min(1, 'El título es requerido'),
    amount: z.string().min(1, 'El monto es requerido'),
    wallet: z.string().min(1, 'La billetera es requerida'),
    category: z.string().min(1, 'La categoría es requerida'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({
        required_error: 'La fecha es requerida',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido'),
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
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido'),
})

const transferFormSchema = z.object({
    type: z.enum(['TRANSFERENCIA', 'PAGO_TARJETA']),
    title: z.string().min(1, 'El título es requerido'),
    amount: z.string().min(1, 'El monto es requerido'),
    fromWallet: z.string().min(1, 'La billetera de origen es requerida'),
    toWallet: z.string().min(1, 'La billetera de destino es requerida'),
    description: z.string().max(100, 'La descripción no debe exceder 100 caracteres'),
    date: z.date({
        required_error: 'La fecha es requerida',
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido'),
})

const formSchema = z.discriminatedUnion('type', [
    standardFormSchema,
    transportFormSchema,
    transferFormSchema,
])

type FormData = z.infer<typeof formSchema>

const transactionTypeLabel: Record<FormData['type'], string> = {
    INGRESO: 'Ingreso',
    GASTO: 'Gasto',
    TRANSPORTE: 'Transporte',
    TRANSFERENCIA: 'Transferencia',
    TARJETA_CONSUMO: 'Consumo con tarjeta',
    PAGO_TARJETA: 'Pago de tarjeta',
}

interface CreateTransactionFormProps {
    wallets: Wallet[]
    categories: Category[] | null
    wallet?: Wallet
}

export const CreateTransactionForm = ({ wallets, categories, wallet }: CreateTransactionFormProps) => {

    const router = useRouter()

    const [selectedWalletType, setSelectedWalletType] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'GASTO',
            wallet: wallet?.id || '',
            date: new Date(),
            time: format(new Date(), 'HH:mm:ss'),
        },
    })

    const watchWallet = form.watch('wallet')
    const watchType = form.watch('type')
    const activeWallets = wallets.filter(w => w.isActive)
    const isCreditCardContext = selectedWalletType === 'Tarjeta de Crédito'
    const isTransferLike = watchType === 'TRANSFERENCIA' || watchType === 'PAGO_TARJETA'

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
        setError(null)
        setIsPending(true)

        try {
            const date = combineDateAndTime(values.date, values.time)

            let response

            if (values.type === 'TRANSPORTE') {
                const fareValue = activeWallets.find(w => w.id === values.wallet)?.fareValue || 0
                const submissionData: CreateTransactionInput = {
                    type: values.type,
                    title: values.title,
                    description: values.description,
                    date,
                    fareValue,
                    numberOfTrips: parseInt(values.numberOfTrips, 10),
                    categoryId: categories?.find(c => c.name === 'Transporte')?.id,
                    walletId: values.wallet,
                    amount: toSignedAmount('TRANSPORTE', roundMoney(fareValue * parseInt(values.numberOfTrips, 10)))
                }
                response = await createTransaction(submissionData)
            } else if (values.type === 'TRANSFERENCIA' || values.type === 'PAGO_TARJETA') {
                const submissionData: CreateTransactionInput = {
                    type: values.type,
                    title: values.title,
                    description: values.description,
                    date,
                    amount: toTransferAmount(parseFloat(values.amount)),
                    categoryId: categories?.find(c => c.name === 'Finanzas')?.id ?? categories?.find(c => c.name === 'Otros')?.id,
                    fromWalletId: values.fromWallet,
                    toWalletId: values.toWallet,
                    walletId: values.fromWallet
                }
                response = await createTransaction(submissionData)
            } else if ('wallet' in values && 'category' in values && categories) {
                const submissionData: CreateTransactionInput = {
                    type: values.type,
                    title: values.title,
                    description: values.description,
                    date,
                    amount: toSignedAmount(values.type, parseFloat(values.amount)),
                    categoryId: categories.find(c => c.name === values.category)?.id || categories.find(c => c.name === 'Otros')?.id,
                    walletId: values.wallet
                }
                response = await createTransaction(submissionData)
            }

            if (!response?.ok) {
                setError(response?.message || 'No se pudo guardar la transacción')
                return
            }

            router.push(wallet ? `/billeteras/${wallet.id}` : '/transacciones')
            router.refresh()
        } finally {
            setIsPending(false)
        }
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
                                        {(selectedWalletType === 'Transporte'
                                            ? ['TRANSPORTE']
                                            : selectedWalletType === 'Tarjeta de Crédito'
                                                ? ['TARJETA_CONSUMO']
                                                : ['GASTO', 'INGRESO', 'TRANSFERENCIA', 'PAGO_TARJETA']).map((type) => (
                                        <Button
                                            key={type}
                                            type='button'
                                            variant={field.value === type ? 'default' : 'outline'}
                                            className='flex-1'
                                            onClick={() => field.onChange(type)}
                                        >
                                            {transactionTypeLabel[type as FormData['type']]}
                                        </Button>
                                    ))}

                                </div>
                            </FormControl>
                            <FormDescription>
                                {watchType === 'PAGO_TARJETA'
                                    ? 'Usa este tipo para mover dinero desde una cuenta o efectivo hacia una tarjeta de crédito.'
                                    : watchType === 'TARJETA_CONSUMO'
                                        ? 'Registra una compra real hecha con la tarjeta de crédito seleccionada.'
                                        : watchType === 'TRANSPORTE'
                                            ? 'Registra viajes realizados; el sistema calcula el monto usando el valor del pasaje.'
                                            : 'Cada transacción guarda la fecha y hora exactas del evento, incluyendo segundos.'}
                            </FormDescription>
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
                                <FormLabel>{isCreditCardContext ? 'Tarjeta' : 'Cuenta o billetera'}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='h-14'>
                                            <SelectValue placeholder={isCreditCardContext ? 'Selecciona una tarjeta' : 'Selecciona una cuenta'} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {activeWallets.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                {wallet.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {isCreditCardContext
                                        ? 'La compra quedará asociada a esta tarjeta y aumentará su deuda pendiente.'
                                        : 'Selecciona la cuenta principal sobre la que impactará el movimiento.'}
                                </FormDescription>
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
                {isTransferLike && (
                    <>
                        <FormField
                            control={form.control}
                            name='fromWallet'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuenta de Origen</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='h-14'>
                                                <SelectValue placeholder='Selecciona una billetera' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activeWallets.map((wallet) => (
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
                                    <FormLabel>{watchType === 'PAGO_TARJETA' ? 'Tarjeta a pagar' : 'Cuenta de Destino'}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='h-14'>
                                                <SelectValue placeholder='Selecciona una billetera' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activeWallets
                                                .filter(w => w.id !== form.watch('fromWallet'))
                                                .filter(w => watchType === 'PAGO_TARJETA' ? w.type === 'Tarjeta de Crédito' : true)
                                                .map((wallet) => (
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
                {watchType !== 'TRANSFERENCIA' && watchType !== 'TRANSPORTE' && watchType !== 'PAGO_TARJETA' && (
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
                                            step='1'
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
                {error && (
                    <Alert variant='destructive'>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button type='submit' className='w-full h-14 text-lg'>
                    {isPending ? 'Guardando...' : 'Guardar Transacción'}
                </Button>
            </form>
        </Form>
    )
}

