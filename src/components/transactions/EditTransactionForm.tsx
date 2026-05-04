'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateTransactionById } from '@/actions'
import type { Category, Transaction, UpdateTransactionInput } from '@/interfaces'
import { isTransportTransaction, isTransferTransaction } from '@/interfaces'
import { combineDateAndTime, roundMoney, toSignedAmount, toTransferAmount } from '@/lib/finance'
import { formatCurrency } from '@/utils'
import { Alert, AlertDescription, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

interface EditTransactionFormProps {
    transaction: Transaction
    categories: Category[] | null
    walletId: string
}

const toDatePart = (value: string) => format(new Date(value), 'yyyy-MM-dd')
const toTimePart = (value: string) => format(new Date(value), 'HH:mm:ss')
const toLocalDate = (date: string) => new Date(`${date}T00:00:00`)

const linkedMovementLabel = (transaction: Transaction) => {
    if (transaction.installmentPlanId || transaction.installmentOccurrenceId) return 'Está ligado a una compra/cuota de tarjeta.'
    if (transaction.scheduledOccurrenceId || transaction.scheduledPlanId) return 'Está ligado a un pago programado.'
    if (transaction.debtId) return 'Está ligado a una deuda.'
    if (transaction.type === 'PAGO_TARJETA') return 'Es un pago de tarjeta.'
    return null
}

export const EditTransactionForm = ({ transaction, categories, walletId }: EditTransactionFormProps) => {
    const router = useRouter()
    const occurredAt = transaction.occurredAt || transaction.date
    const isLinkedOrCardPayment = Boolean(linkedMovementLabel(transaction))
    const [title, setTitle] = useState(transaction.title)
    const [description, setDescription] = useState(transaction.description ?? '')
    const [amount, setAmount] = useState(Math.abs(transaction.amount).toString())
    const [categoryId, setCategoryId] = useState(transaction.categoryId ?? 'none')
    const [numberOfTrips, setNumberOfTrips] = useState(isTransportTransaction(transaction) ? transaction.numberOfTrips.toString() : '1')
    const [date, setDate] = useState(toDatePart(occurredAt))
    const [time, setTime] = useState(toTimePart(occurredAt))
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const categoryOptions = categories ?? []
    const categoryIsEditable = !isTransferTransaction(transaction) && !isTransportTransaction(transaction) && transaction.type !== 'PAGO_TARJETA'
    const amountIsLocked = isLinkedOrCardPayment
    const parsedAmount = amountIsLocked ? Math.abs(transaction.amount) : Number(amount || 0)
    const label = linkedMovementLabel(transaction)

    const submit = async () => {
        setError(null)

        if (!title.trim()) {
            setError('El título es requerido')
            return
        }

        if (!amountIsLocked && !isTransportTransaction(transaction) && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
            setError('El monto debe ser mayor a 0')
            return
        }

        if (isTransportTransaction(transaction) && Number(numberOfTrips) < 1) {
            setError('El número de viajes debe ser mayor a 0')
            return
        }

        setIsPending(true)
        try {
            const timestamp = combineDateAndTime(toLocalDate(date), time)
            const nextAmount = isTransportTransaction(transaction) && transaction.fareValue
                ? roundMoney(transaction.fareValue * Number(numberOfTrips || 0))
                : parsedAmount

            const updateData: UpdateTransactionInput = {
                title: title.trim(),
                description: description.trim(),
                date: timestamp,
                categoryId: categoryId === 'none' ? undefined : categoryId,
                newAmount: isTransferTransaction(transaction) || transaction.type === 'PAGO_TARJETA'
                    ? toTransferAmount(nextAmount)
                    : toSignedAmount(transaction.type, nextAmount),
                numberOfTrips: isTransportTransaction(transaction) ? Number(numberOfTrips) : undefined,
                fareValue: isTransportTransaction(transaction) ? transaction.fareValue : undefined,
                walletId: transaction.walletId,
                type: transaction.type,
                amount: transaction.amount,
                fromWalletId: transaction.fromWalletId,
                toWalletId: transaction.toWalletId,
                scheduledPlanId: transaction.scheduledPlanId,
                scheduledOccurrenceId: transaction.scheduledOccurrenceId,
                installmentPlanId: transaction.installmentPlanId,
                installmentOccurrenceId: transaction.installmentOccurrenceId,
                debtId: transaction.debtId,
                personId: transaction.personId,
            }

            const response = await updateTransactionById(updateData, transaction.id)
            if (!response?.ok) {
                setError(response?.message || 'No se pudo actualizar el movimiento')
                return
            }

            router.push(walletId ? `/billeteras/${walletId}` : '/transacciones')
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className='space-y-5 text-left'>
            <section className='rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                        <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Editar movimiento</p>
                        <h2 className='mt-2 text-2xl font-semibold text-white'>{transaction.title}</h2>
                    </div>
                    <span className='rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300'>
                        {transaction.type.replaceAll('_', ' ')}
                    </span>
                </div>

                {label && (
                    <div className='mt-4 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100'>
                        <LockKeyhole className='mt-0.5 h-4 w-4 shrink-0' />
                        <p>{label} Por seguridad puedes corregir título, categoría, nota, fecha y hora; el monto queda protegido para no descuadrar saldos o cierres.</p>
                    </div>
                )}
            </section>

            <section className='space-y-5 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5'>
                <div className='grid gap-4 sm:grid-cols-2'>
                    <Field label='Título'>
                        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='Título del movimiento' />
                    </Field>

                    {isTransportTransaction(transaction) ? (
                        <Field label='Número de viajes'>
                            <Input className='h-14 text-center text-2xl font-bold' type='number' min='1' value={numberOfTrips} onChange={(event) => setNumberOfTrips(event.target.value)} disabled={amountIsLocked} />
                        </Field>
                    ) : (
                        <Field label='Monto'>
                            <Input
                                className='h-14 text-center text-2xl font-bold'
                                type='number'
                                min='0'
                                step='0.01'
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                disabled={amountIsLocked}
                            />
                        </Field>
                    )}
                </div>

                {categoryIsEditable && (
                    <Field label='Categoría'>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className='h-12'><SelectValue placeholder='Selecciona una categoría' /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value='none'>Sin categoría</SelectItem>
                                {categoryOptions.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                <Field label='Descripción'>
                    <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Opcional' className='min-h-20 resize-none' maxLength={160} />
                </Field>

                <div className='grid gap-4 sm:grid-cols-2'>
                    <Field label='Fecha'>
                        <Input type='date' value={date} onChange={(event) => setDate(event.target.value)} />
                    </Field>
                    <Field label='Hora'>
                        <Input type='time' step='1' value={time} onChange={(event) => setTime(event.target.value)} />
                    </Field>
                </div>

                <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                    <div className='flex items-center justify-between gap-4'>
                        <span className='text-sm text-slate-400'>Monto registrado</span>
                        <span className='text-right text-sm font-semibold text-white'>{formatCurrency(isTransportTransaction(transaction) && transaction.fareValue ? transaction.fareValue * Number(numberOfTrips || 0) : parsedAmount)}</span>
                    </div>
                    <div className='mt-2 flex items-center justify-between gap-4'>
                        <span className='text-sm text-slate-400'>Fecha</span>
                        <span className='text-right text-sm font-semibold text-white'>{date} · {time}</span>
                    </div>
                </div>
            </section>

            {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}

            <Button type='button' className='h-12 w-full text-base' onClick={submit} disabled={isPending}>
                <CheckCircle2 className='h-4 w-4' />
                {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
        </div>
    )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className='grid gap-2'>
        <Label>{label}</Label>
        {children}
    </div>
)
