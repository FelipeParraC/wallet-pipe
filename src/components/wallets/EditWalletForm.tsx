'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { UpdateWalletInput, Wallet } from '@/interfaces'
import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormDescription, FormMessage, Checkbox, Button } from '@/components/ui'
import { updateWalletById } from '@/actions'
import { useRouter } from 'next/navigation'

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
})

type FormData = z.infer<typeof formSchema>

interface EditWalletFormProps {
    wallet: Wallet
}

export const EditWalletForm = ({ wallet }: EditWalletFormProps) => {

    const router = useRouter()

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: wallet.name,
            color: wallet.color,
            includeInTotal: wallet.includeInTotal,
            fareValue: wallet.type === 'Transporte' && wallet.fareValue ? wallet.fareValue.toString() : '',
        },
    })

    const watchType = wallet.type

    const handleUpdate = async (values: FormData) => {
        const updatedData: UpdateWalletInput = {
            name: values.name,
            color: values.color,
            includeInTotal: values.includeInTotal,
            fareValue: values.fareValue ? parseFloat(values.fareValue) : undefined,
        }
        await updateWalletById(updatedData, wallet.id)

        router.push(`/billeteras/${wallet.id}`)
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
                    Actualizar Billetera
                </Button>
            </form>
        </Form>
    )
}
