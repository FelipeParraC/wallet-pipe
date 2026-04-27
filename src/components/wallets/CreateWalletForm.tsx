'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { WalletType } from '@/interfaces'
import { Coins, CreditCard, Landmark, WalletIcon, Bus } from 'lucide-react'
import { Alert, AlertDescription, Button, Checkbox, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui'
import { createWallet } from '@/actions'
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

const walletTypes = [
    { value: 'Efectivo', label: 'Efectivo', icon: Coins },
    { value: 'Cuenta Bancaria', label: 'Cuenta Bancaria', icon: Landmark },
    { value: 'Ahorros', label: 'Ahorros', icon: WalletIcon },
    { value: 'Transporte', label: 'Transporte', icon: Bus },
    { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', icon: CreditCard },
]

const walletTypeValues = walletTypes.map((type) => type.value)

const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    balance: z
        .string()
        .min(1, 'La cantidad es requerida')
        .refine((val) => !isNaN(Number(val)), { message: 'Debe ser un número válido' }),
    type: z.enum(walletTypeValues as [string, ...string[]], { errorMap: () => ({ message: 'El tipo es requerido' }) }),
    color: z.string().min(1, 'El color es requerido'),
    includeInTotal: z.boolean().default(true),
    fareValue: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Number(val)), { message: 'Debe ser un número válido' }),
    creditLimit: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Number(val)), { message: 'Debe ser un número válido' }),
    statementClosingDay: z.string().optional(),
    paymentDueDay: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export const CreateWalletForm = () => {

    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            includeInTotal: true,
            color: '#3b82f6',
        },
    })

    const watchType = form.watch('type')
    const isCreditCard = watchType === 'Tarjeta de Crédito'
    const isTransport = watchType === 'Transporte'

    useEffect(() => {
        if (isCreditCard || isTransport) {
            form.setValue('includeInTotal', false)
        }
    }, [form, isCreditCard, isTransport])

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setError(null)
        setIsPending(true)
        const selectedType = walletTypes.find((t) => t.value === values.type)
    
        if (!selectedType) {
            console.error('El tipo seleccionado no es válido.')
            return
        }
    
        const fareValue =
            values.type === 'Transporte' && values.fareValue
                ? parseFloat(values.fareValue)
                : undefined

        const isCreditCard = values.type === 'Tarjeta de Crédito'
    
        const walletData = {
            name: values.name,
            balance: roundMoney(parseFloat(values.balance)),
            type: values.type as WalletType,
            color: values.color,
            includeInTotal: values.includeInTotal,
            fareValue,
            creditLimit: isCreditCard && values.creditLimit ? roundMoney(parseFloat(values.creditLimit)) : undefined,
            availableCredit: isCreditCard && values.creditLimit ? roundMoney(parseFloat(values.creditLimit) - parseFloat(values.balance)) : undefined,
            statementClosingDay: isCreditCard && values.statementClosingDay ? parseInt(values.statementClosingDay, 10) : undefined,
            paymentDueDay: isCreditCard && values.paymentDueDay ? parseInt(values.paymentDueDay, 10) : undefined,
        }

        const response = await createWallet( walletData )

        setIsPending(false)

        if (!response.ok) {
            setError(response.message)
            return
        }

        router.push('/billeteras')
        router.refresh()
    }
    
    

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
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
                <FormField
                    control={form.control}
                    name='balance'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{isCreditCard ? 'Deuda Actual' : 'Saldo Inicial'}</FormLabel>
                            <FormControl>
                                <Input
                                    type='number'
                                    step='0.01'
                                    placeholder={isCreditCard ? '0.00' : '0.00'}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {isCreditCard
                                    ? 'Si la tarjeta ya tiene compras pendientes, registra aquí la deuda actual para iniciar el seguimiento.'
                                    : 'Este saldo crea el punto de partida de la cuenta al momento de registrarla.'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='type'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Billetera</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Selecciona un tipo' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {walletTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className='flex items-center'>
                                                <type.icon className='mr-2 h-4 w-4' />
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                {isCreditCard && (
                    <div className='rounded-lg border border-violet-500/30 bg-violet-500/10 p-4 text-left'>
                        <p className='text-sm font-medium text-violet-200'>Configuración de tarjeta de crédito</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                            El saldo de esta tarjeta se interpreta como deuda pendiente. Los pagos se registran desde otra cuenta hacia esta tarjeta.
                        </p>
                    </div>
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
                                    disabled={isCreditCard || isTransport}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                                <FormLabel>
                                    Incluir en el balance total
                                </FormLabel>
                                <FormDescription>
                                    {isCreditCard
                                        ? 'Las tarjetas no se suman al disponible general; se muestran aparte como deuda.'
                                        : isTransport
                                            ? 'Las tarjetas de transporte se mantienen fuera del balance general para no inflar el disponible.'
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
                    <>
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
                                        Cupo total aprobado por el banco para esta tarjeta.
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
                                            Día máximo para pagar ese corte.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}
                <Button type='submit' className='w-full text-white'>
                    {isPending ? 'Creando...' : 'Crear Billetera'}
                </Button>
            </form>
        </Form>
    )
}

