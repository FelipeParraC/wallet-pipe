'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { updateCycleSettings } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'

const formSchema = z.object({
    defaultStartDay: z
        .string()
        .min(1, 'El día es requerido')
        .refine((value) => {
            const numberValue = Number(value)
            return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 31
        }, 'Debe ser un número entre 1 y 31'),
    timezone: z.string().min(1, 'La zona horaria es requerida'),
})

type FormData = z.infer<typeof formSchema>

interface CycleSettingsFormProps {
    defaultStartDay: number
    timezone: string
}

const timezoneOptions = [
    { value: 'America/Bogota', label: 'América/Bogotá' },
    { value: 'America/Mexico_City', label: 'América/Ciudad de México' },
    { value: 'America/Lima', label: 'América/Lima' },
    { value: 'America/Santiago', label: 'América/Santiago' },
]

export const CycleSettingsForm = ({ defaultStartDay, timezone }: CycleSettingsFormProps) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            defaultStartDay: String(defaultStartDay),
            timezone,
        },
    })

    const onSubmit = async (values: FormData) => {
        setError(null)
        setIsPending(true)

        try {
            const response = await updateCycleSettings({
                defaultStartDay: Number(values.defaultStartDay),
                timezone: values.timezone,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                    control={form.control}
                    name='defaultStartDay'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Día de inicio del ciclo</FormLabel>
                            <FormControl>
                                <Input type='number' min='1' max='31' placeholder='23' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='timezone'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zona horaria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Selecciona una zona horaria' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timezoneOptions.map((timezoneOption) => (
                                        <SelectItem key={timezoneOption.value} value={timezoneOption.value}>
                                            {timezoneOption.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <Alert variant='destructive'>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button type='submit' className='w-full'>
                    {isPending ? 'Guardando...' : 'Guardar ciclo'}
                </Button>
            </form>
        </Form>
    )
}
