'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { CreateWalletInput, WalletType } from '@/interfaces'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Coins, CreditCard, WalletIcon, Bus } from 'lucide-react'

//TODO: Cambiar currentUser por el usuario actual
import { currentUser } from '@/seed/data'
import { createWallet } from '@/actions'

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
    { value: 'Cuenta Bancaria', label: 'Cuenta Bancaria', icon: CreditCard },
    { value: 'Ahorros', label: 'Ahorros', icon: WalletIcon },
    { value: 'Transporte', label: 'Transporte', icon: Bus },
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
})

type FormData = z.infer<typeof formSchema>

const onSubmit = (walletData: Partial<CreateWalletInput>) => {
    try {
        const createdWallet = createWallet(walletData as CreateWalletInput)
        console.log('Billetera creada:', createdWallet)
        alert('¡Billetera creada con éxito!')
    } catch (error) {
        console.log(error)
        alert('Ocurrió un error al crear la billetera. Por favor, inténtalo de nuevo.')
    }
}

export function CreateWalletForm() {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            includeInTotal: true,
            color: '#3b82f6',
        },
    })

    const watchType = form.watch('type')

    function handleSubmit(values: z.infer<typeof formSchema>) {
        const selectedType = walletTypes.find((t) => t.value === values.type)
    
        if (!selectedType) {
            console.error('El tipo seleccionado no es válido.')
            return
        }
    
        const fareValue =
            values.type === 'Transporte' && values.fareValue
                ? parseFloat(values.fareValue)
                : undefined
    
        onSubmit({
            userId: currentUser.id,
            name: values.name,
            balance: parseFloat(values.balance),
            type: values.type as WalletType,
            color: values.color,
            includeInTotal: values.includeInTotal,
            fareValue,
        })
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
                            <FormLabel>Cantidad Inicial</FormLabel>
                            <FormControl>
                                <Input type='number' step='0.01' placeholder='0.00' {...field} />
                            </FormControl>
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
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                                <FormLabel>
                                    Incluir en el balance total
                                </FormLabel>
                                <FormDescription>
                                    Si está marcado, esta billetera se incluirá en el cálculo del balance total.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                <Button type='submit' className='w-full text-white'>
                    Crear Billetera
                </Button>
            </form>
        </Form>
    )
}

