'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { saveCyclePeriodOverride, updateCycleSettings } from '@/actions'
import { Alert, AlertDescription, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import type { CyclePeriod, CyclePeriodOverride } from '@/interfaces'

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
    currentCycle?: CyclePeriod | null
    periodOverrides?: CyclePeriodOverride[]
}

const timezoneOptions = [
    { value: 'America/Bogota', label: 'América/Bogotá' },
    { value: 'America/Mexico_City', label: 'América/Ciudad de México' },
    { value: 'America/Lima', label: 'América/Lima' },
    { value: 'America/Santiago', label: 'América/Santiago' },
]

const toDateTimeLocal = (value?: string) => {
    const date = value ? new Date(value) : new Date()
    const pad = (part: number) => String(part).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export const CycleSettingsForm = ({ defaultStartDay, timezone, currentCycle, periodOverrides = [] }: CycleSettingsFormProps) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [periodError, setPeriodError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [isPeriodPending, setIsPeriodPending] = useState(false)
    const [manualStartsAt, setManualStartsAt] = useState(toDateTimeLocal(currentCycle?.startsAt))
    const [manualEndsAt, setManualEndsAt] = useState(toDateTimeLocal(currentCycle?.endsAt))
    const [manualNote, setManualNote] = useState('')

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

    const saveManualPeriod = async () => {
        setPeriodError(null)
        setIsPeriodPending(true)

        try {
            const response = await saveCyclePeriodOverride({
                startsAt: new Date(manualStartsAt).toISOString(),
                endsAt: new Date(manualEndsAt).toISOString(),
                note: manualNote,
            })

            if (!response.ok) {
                setPeriodError(response.message)
                return
            }

            router.refresh()
        } catch {
            setPeriodError('Revisa las fechas del periodo manual')
        } finally {
            setIsPeriodPending(false)
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

            <div className='mt-8 space-y-4 border-t border-white/10 pt-6'>
                <div>
                    <h3 className='text-sm font-semibold text-white'>Ajuste puntual del periodo actual</h3>
                    <p className='mt-1 text-sm text-slate-400'>
                        Úsalo solo cuando un ciclo necesite fechas exactas distintas al día fijo de inicio.
                    </p>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='grid gap-2'>
                        <FormLabel>Inicio</FormLabel>
                        <Input type='datetime-local' step='1' value={manualStartsAt} onChange={(event) => setManualStartsAt(event.target.value)} />
                    </div>
                    <div className='grid gap-2'>
                        <FormLabel>Fin</FormLabel>
                        <Input type='datetime-local' step='1' value={manualEndsAt} onChange={(event) => setManualEndsAt(event.target.value)} />
                    </div>
                </div>

                <div className='grid gap-2'>
                    <FormLabel>Nota</FormLabel>
                    <Input value={manualNote} onChange={(event) => setManualNote(event.target.value)} placeholder='Opcional' />
                </div>

                {periodError && (
                    <Alert variant='destructive'>
                        <AlertDescription>{periodError}</AlertDescription>
                    </Alert>
                )}

                <Button type='button' variant='outline' className='w-full' onClick={saveManualPeriod} disabled={isPeriodPending}>
                    {isPeriodPending ? 'Guardando...' : 'Guardar periodo manual'}
                </Button>

                {periodOverrides.length > 0 && (
                    <div className='space-y-2'>
                        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Ajustes recientes</p>
                        {periodOverrides.slice(0, 4).map((periodOverride) => (
                            <div key={periodOverride.id} className='rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300'>
                                {format(new Date(periodOverride.startsAt), 'd MMM yyyy', { locale: es })} - {format(new Date(periodOverride.endsAt), 'd MMM yyyy', { locale: es })}
                                {periodOverride.note ? <span className='text-slate-500'> · {periodOverride.note}</span> : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Form>
    )
}
