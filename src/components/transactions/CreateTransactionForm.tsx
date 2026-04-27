'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { ArrowRightLeft, Banknote, Bus, CheckCircle2, CreditCard, ReceiptText, WalletCards } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Category, Wallet } from '@/interfaces'
import { createMovementFromForm } from '@/actions'
import { Alert, AlertDescription, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../ui'
import { formatCurrency } from '@/utils'

type MovementKind = 'INGRESO' | 'GASTO' | 'CARD_PURCHASE' | 'TRANSFER' | 'CARD_PAYMENT' | 'TRANSPORT'
type InstallmentMode = 'SINGLE' | 'INSTALLMENTS'
type PaymentMode = 'PARCIAL' | 'TOTAL'

interface CreateTransactionFormProps {
    wallets: Wallet[]
    categories: Category[] | null
    wallet?: Wallet
}

const nowDate = () => format(new Date(), 'yyyy-MM-dd')
const nowTime = () => format(new Date(), 'HH:mm:ss')

const toLocalDateTimeValue = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const toIsoFromParts = (date: string, time: string) => new Date(`${date}T${time || '00:00:00'}`).toISOString()

const addMonths = (date: Date, months: number) => {
    const next = new Date(date)
    next.setMonth(next.getMonth() + months)
    return next
}

const clampDay = (year: number, month: number, day: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate()
    return Math.min(day, lastDay)
}

const deriveFirstDueAt = (card: Wallet | undefined, date: string) => {
    if (!card?.statementClosingDay || !card.paymentDueDay || !date) return ''

    const purchase = new Date(`${date}T12:00:00`)
    let statementYear = purchase.getFullYear()
    let statementMonth = purchase.getMonth()

    if (purchase.getDate() > card.statementClosingDay) {
        const nextStatement = addMonths(new Date(statementYear, statementMonth, 1), 1)
        statementYear = nextStatement.getFullYear()
        statementMonth = nextStatement.getMonth()
    }

    let dueYear = statementYear
    let dueMonth = statementMonth

    if (card.paymentDueDay <= card.statementClosingDay) {
        const nextDue = addMonths(new Date(dueYear, dueMonth, 1), 1)
        dueYear = nextDue.getFullYear()
        dueMonth = nextDue.getMonth()
    }

    return toLocalDateTimeValue(new Date(dueYear, dueMonth, clampDay(dueYear, dueMonth, card.paymentDueDay), 8, 0, 0))
}

const movementMeta: Record<MovementKind, { label: string; description: string; icon: typeof Banknote }> = {
    INGRESO: { label: 'Ingreso', description: 'Dinero que entra a una cuenta normal.', icon: Banknote },
    GASTO: { label: 'Gasto', description: 'Compra o salida desde una cuenta normal.', icon: ReceiptText },
    CARD_PURCHASE: { label: 'Compra con tarjeta', description: 'Consumo a una cuota o diferido.', icon: CreditCard },
    TRANSFER: { label: 'Transferencia', description: 'Movimiento entre cuentas propias.', icon: ArrowRightLeft },
    CARD_PAYMENT: { label: 'Pago de tarjeta', description: 'Abono parcial o total a una tarjeta.', icon: WalletCards },
    TRANSPORT: { label: 'Transporte', description: 'Viajes calculados por valor de pasaje.', icon: Bus },
}

export const CreateTransactionForm = ({ wallets, categories, wallet }: CreateTransactionFormProps) => {
    const router = useRouter()
    const activeWallets = wallets.filter((item) => item.isActive)
    const normalWallets = activeWallets.filter((item) => item.type !== 'Tarjeta de Crédito' && item.type !== 'Transporte')
    const creditCards = activeWallets.filter((item) => item.type === 'Tarjeta de Crédito')
    const transportWallets = activeWallets.filter((item) => item.type === 'Transporte')
    const defaultKind: MovementKind = wallet?.type === 'Tarjeta de Crédito'
        ? 'CARD_PURCHASE'
        : wallet?.type === 'Transporte'
            ? 'TRANSPORT'
            : normalWallets.length > 0
                ? 'GASTO'
                : creditCards.length > 0
                    ? 'CARD_PURCHASE'
                    : 'TRANSPORT'

    const [step, setStep] = useState(1)
    const [kind, setKind] = useState<MovementKind>(defaultKind)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [walletId, setWalletId] = useState(wallet && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte' ? wallet.id : normalWallets[0]?.id ?? '')
    const [cardWalletId, setCardWalletId] = useState(wallet?.type === 'Tarjeta de Crédito' ? wallet.id : creditCards[0]?.id ?? '')
    const [transportWalletId, setTransportWalletId] = useState(wallet?.type === 'Transporte' ? wallet.id : transportWallets[0]?.id ?? '')
    const [fromWalletId, setFromWalletId] = useState(normalWallets[0]?.id ?? '')
    const [toWalletId, setToWalletId] = useState(normalWallets.find((item) => item.id !== normalWallets[0]?.id)?.id ?? '')
    const [numberOfTrips, setNumberOfTrips] = useState('1')
    const [installmentMode, setInstallmentMode] = useState<InstallmentMode>('SINGLE')
    const [totalInstallments, setTotalInstallments] = useState('2')
    const [firstDueAt, setFirstDueAt] = useState('')
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('PARCIAL')
    const [date, setDate] = useState(nowDate())
    const [time, setTime] = useState(nowTime())
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const selectedCard = creditCards.find((item) => item.id === cardWalletId)
    const selectedTransportWallet = transportWallets.find((item) => item.id === transportWalletId)
    const estimatedInstallment = installmentMode === 'INSTALLMENTS' && Number(totalInstallments) > 0
        ? Number(amount || 0) / Number(totalInstallments)
        : 0
    const paymentAmount = paymentMode === 'TOTAL' ? selectedCard?.balance ?? 0 : Number(amount || 0)
    const transportAmount = (selectedTransportWallet?.fareValue ?? 0) * Number(numberOfTrips || 0)

    const availableKinds = useMemo(() => {
        const kinds: MovementKind[] = []
        if (normalWallets.length > 0) kinds.push('GASTO', 'INGRESO')
        if (creditCards.length > 0) kinds.push('CARD_PURCHASE')
        if (normalWallets.length >= 2) kinds.push('TRANSFER')
        if (normalWallets.length > 0 && creditCards.length > 0) kinds.push('CARD_PAYMENT')
        if (transportWallets.length > 0) kinds.push('TRANSPORT')
        return kinds
    }, [normalWallets.length, creditCards.length, transportWallets.length])

    useEffect(() => {
        if (!availableKinds.includes(kind) && availableKinds[0]) {
            setKind(availableKinds[0])
        }
    }, [availableKinds, kind])

    useEffect(() => {
        if (kind !== 'CARD_PURCHASE' || installmentMode !== 'INSTALLMENTS') return
        setFirstDueAt((current) => current || deriveFirstDueAt(selectedCard, date))
    }, [kind, installmentMode, selectedCard, date])

    useEffect(() => {
        if (kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL') {
            setAmount(String(selectedCard?.balance ?? 0))
        }
    }, [kind, paymentMode, selectedCard])

    const resetForKind = (nextKind: MovementKind) => {
        setKind(nextKind)
        setStep(2)
        setError(null)
        setAmount('')
        setTitle('')
        setDescription('')
        setInstallmentMode('SINGLE')
        setPaymentMode('PARCIAL')
        setFirstDueAt('')
    }

    const validate = () => {
        if (!title.trim()) return 'El título es requerido'
        if (kind !== 'TRANSPORT' && Number(amount || 0) <= 0) return 'El monto debe ser mayor a 0'
        if ((kind === 'GASTO' || kind === 'INGRESO' || kind === 'CARD_PURCHASE') && !categoryId) return 'Selecciona una categoría'
        if ((kind === 'GASTO' || kind === 'INGRESO') && !walletId) return 'Selecciona una cuenta'
        if (kind === 'CARD_PURCHASE' && !cardWalletId) return 'Selecciona una tarjeta'
        if (kind === 'CARD_PURCHASE' && installmentMode === 'INSTALLMENTS' && Number(totalInstallments) < 2) return 'Las cuotas deben ser mínimo 2'
        if (kind === 'CARD_PURCHASE' && installmentMode === 'INSTALLMENTS' && !firstDueAt) return 'Selecciona la primera fecha de pago'
        if (kind === 'TRANSFER' && (!fromWalletId || !toWalletId || fromWalletId === toWalletId)) return 'Selecciona cuentas de origen y destino diferentes'
        if (kind === 'CARD_PAYMENT' && (!fromWalletId || !cardWalletId)) return 'Selecciona cuenta origen y tarjeta'
        if (kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL' && (!selectedCard || selectedCard.balance <= 0)) return 'La tarjeta no tiene deuda pendiente'
        if (kind === 'TRANSPORT' && (!transportWalletId || Number(numberOfTrips) < 1)) return 'Selecciona billetera y número de viajes'
        return null
    }

    const buildPayload = () => {
        const occurredAt = toIsoFromParts(date, time)
        const base = {
            title,
            description,
            occurredAt,
            categoryId: categoryId || undefined,
        }

        if (kind === 'GASTO' || kind === 'INGRESO') {
            return {
                ...base,
                kind: 'STANDARD' as const,
                type: kind,
                walletId,
                amount: Number(amount),
            }
        }

        if (kind === 'TRANSPORT') {
            return {
                ...base,
                kind: 'TRANSPORT' as const,
                walletId: transportWalletId,
                numberOfTrips: Number(numberOfTrips),
            }
        }

        if (kind === 'TRANSFER') {
            return {
                ...base,
                kind: 'TRANSFER' as const,
                fromWalletId,
                toWalletId,
                amount: Number(amount),
            }
        }

        if (kind === 'CARD_PURCHASE') {
            return {
                ...base,
                kind: 'CARD_PURCHASE' as const,
                cardWalletId,
                amount: Number(amount),
                installmentMode,
                totalInstallments: installmentMode === 'INSTALLMENTS' ? Number(totalInstallments) : undefined,
                firstDueAt: installmentMode === 'INSTALLMENTS' ? new Date(firstDueAt).toISOString() : undefined,
                merchant: title,
            }
        }

        return {
            ...base,
            kind: 'CARD_PAYMENT' as const,
            paymentMode,
            fromWalletId,
            cardWalletId,
            amount: paymentMode === 'PARCIAL' ? Number(amount) : undefined,
        }
    }

    const submit = async () => {
        const validationError = validate()
        if (validationError) {
            setError(validationError)
            setStep(2)
            return
        }

        setError(null)
        setIsPending(true)
        try {
            const response = await createMovementFromForm(buildPayload())
            if (!response.ok) {
                setError(response.message)
                return
            }

            router.push(wallet ? `/billeteras/${wallet.id}` : '/transacciones')
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    const ctaLabel = kind === 'CARD_PURCHASE'
        ? 'Registrar compra'
        : kind === 'CARD_PAYMENT'
            ? 'Pagar tarjeta'
            : 'Guardar movimiento'

    return (
        <div className='space-y-5 text-left'>
            <div className='grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-2'>
                {['Tipo', 'Datos', 'Resumen'].map((label, index) => (
                    <button
                        key={label}
                        type='button'
                        onClick={() => setStep(index + 1)}
                        className={[
                            'rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all',
                            step === index + 1 ? 'bg-sky-400 text-white shadow-[0_10px_24px_rgba(14,165,233,0.26)]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                        ].join(' ')}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {step === 1 && (
                <div className='grid gap-3 sm:grid-cols-2'>
                    {availableKinds.map((item) => {
                        const meta = movementMeta[item]
                        const Icon = meta.icon
                        return (
                            <button
                                key={item}
                                type='button'
                                onClick={() => resetForKind(item)}
                                className={[
                                    'rounded-[1.5rem] border p-4 text-left transition-all',
                                    kind === item ? 'border-sky-300/50 bg-sky-400/12 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]',
                                ].join(' ')}
                            >
                                <span className='mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08]'>
                                    <Icon className='h-5 w-5' />
                                </span>
                                <span className='block font-semibold'>{meta.label}</span>
                                <span className='mt-1 block text-sm text-slate-400'>{meta.description}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {step === 2 && (
                <div className='space-y-5 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <Field label={kind === 'CARD_PURCHASE' ? 'Comercio o compra' : 'Título'}>
                            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='Ej. Mercado, nómina, portátil' />
                        </Field>

                        {(kind === 'GASTO' || kind === 'INGRESO') && (
                            <Field label='Cuenta'>
                                <WalletSelect wallets={normalWallets} value={walletId} onChange={setWalletId} />
                            </Field>
                        )}

                        {kind === 'CARD_PURCHASE' && (
                            <Field label='Tarjeta'>
                                <WalletSelect wallets={creditCards} value={cardWalletId} onChange={setCardWalletId} />
                            </Field>
                        )}

                        {kind === 'TRANSPORT' && (
                            <Field label='Billetera transporte'>
                                <WalletSelect wallets={transportWallets} value={transportWalletId} onChange={setTransportWalletId} />
                            </Field>
                        )}
                    </div>

                    {kind === 'TRANSFER' && (
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <Field label='Origen'>
                                <WalletSelect wallets={normalWallets} value={fromWalletId} onChange={(value) => {
                                    setFromWalletId(value)
                                    if (value === toWalletId) setToWalletId(normalWallets.find((item) => item.id !== value)?.id ?? '')
                                }} />
                            </Field>
                            <Field label='Destino'>
                                <WalletSelect wallets={normalWallets.filter((item) => item.id !== fromWalletId)} value={toWalletId} onChange={setToWalletId} />
                            </Field>
                        </div>
                    )}

                    {kind === 'CARD_PAYMENT' && (
                        <>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <Field label='Cuenta origen'>
                                    <WalletSelect wallets={normalWallets} value={fromWalletId} onChange={setFromWalletId} />
                                </Field>
                                <Field label='Tarjeta'>
                                    <WalletSelect wallets={creditCards} value={cardWalletId} onChange={setCardWalletId} />
                                </Field>
                            </div>
                            <Segmented
                                value={paymentMode}
                                onChange={(value) => setPaymentMode(value as PaymentMode)}
                                options={[
                                    { value: 'PARCIAL', label: 'Pago parcial' },
                                    { value: 'TOTAL', label: 'Pago total' },
                                ]}
                            />
                            {selectedCard && (
                                <p className='rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300'>
                                    Deuda actual: <span className='font-semibold text-white'>{formatCurrency(selectedCard.balance)}</span>
                                </p>
                            )}
                        </>
                    )}

                    {kind === 'CARD_PURCHASE' && (
                        <>
                            <Segmented
                                value={installmentMode}
                                onChange={(value) => {
                                    setInstallmentMode(value as InstallmentMode)
                                    if (value === 'INSTALLMENTS') setFirstDueAt(deriveFirstDueAt(selectedCard, date))
                                }}
                                options={[
                                    { value: 'SINGLE', label: 'Una cuota' },
                                    { value: 'INSTALLMENTS', label: 'A cuotas' },
                                ]}
                            />
                            {installmentMode === 'INSTALLMENTS' && (
                                <div className='grid gap-4 sm:grid-cols-3'>
                                    <Field label='Número de cuotas'>
                                        <Input type='number' min='2' value={totalInstallments} onChange={(event) => setTotalInstallments(event.target.value)} />
                                    </Field>
                                    <Field label='Primera fecha de pago' className='sm:col-span-2'>
                                        <Input type='datetime-local' step='1' value={firstDueAt} onChange={(event) => setFirstDueAt(event.target.value)} />
                                    </Field>
                                </div>
                            )}
                        </>
                    )}

                    {kind === 'TRANSPORT' ? (
                        <Field label='Número de viajes'>
                            <Input className='h-14 text-center text-2xl font-bold' type='number' min='1' value={numberOfTrips} onChange={(event) => setNumberOfTrips(event.target.value)} />
                        </Field>
                    ) : (
                        <Field label={kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL' ? 'Monto total a pagar' : 'Monto'}>
                            <Input
                                className='h-14 text-center text-2xl font-bold'
                                type='number'
                                min='0'
                                step='0.01'
                                value={kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL' ? String(selectedCard?.balance ?? 0) : amount}
                                onChange={(event) => setAmount(event.target.value)}
                                disabled={kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL'}
                            />
                        </Field>
                    )}

                    {(kind === 'GASTO' || kind === 'INGRESO' || kind === 'CARD_PURCHASE') && (
                        <Field label='Categoría'>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className='h-12'><SelectValue placeholder='Selecciona una categoría' /></SelectTrigger>
                                <SelectContent>
                                    {(categories ?? []).map((category) => (
                                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}

                    <Field label='Descripción'>
                        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Opcional' className='min-h-20 resize-none' />
                    </Field>

                    <div className='grid gap-4 sm:grid-cols-2'>
                        <Field label='Fecha'>
                            <Input type='date' value={date} onChange={(event) => {
                                setDate(event.target.value)
                                if (kind === 'CARD_PURCHASE' && installmentMode === 'INSTALLMENTS') {
                                    setFirstDueAt(deriveFirstDueAt(selectedCard, event.target.value))
                                }
                            }} />
                        </Field>
                        <Field label='Hora'>
                            <Input type='time' step='1' value={time} onChange={(event) => setTime(event.target.value)} />
                        </Field>
                    </div>

                    {installmentMode === 'INSTALLMENTS' && kind === 'CARD_PURCHASE' && Number(totalInstallments) > 0 && Number(amount) > 0 && (
                        <p className='rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-sm text-sky-100'>
                            Cuota estimada: {formatCurrency(estimatedInstallment)}
                        </p>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className='space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5'>
                    <div>
                        <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Resumen</p>
                        <h2 className='mt-2 text-2xl font-semibold text-white'>{movementMeta[kind].label}</h2>
                    </div>
                    <SummaryRow label='Título' value={title || 'Sin título'} />
                    <SummaryRow label='Monto' value={formatCurrency(kind === 'TRANSPORT' ? transportAmount : paymentAmount || Number(amount || 0))} />
                    {kind === 'CARD_PURCHASE' && installmentMode === 'INSTALLMENTS' && (
                        <SummaryRow label='Cuotas' value={`${totalInstallments} cuotas de aprox. ${formatCurrency(estimatedInstallment)}`} />
                    )}
                    {kind === 'CARD_PAYMENT' && paymentMode === 'TOTAL' && (
                        <SummaryRow label='Efecto' value='Saldará la tarjeta y cerrará cuotas pendientes' />
                    )}
                    <SummaryRow label='Fecha' value={`${date} · ${time}`} />
                </div>
            )}

            {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}

            <div className='flex gap-3'>
                {step > 1 && (
                    <Button type='button' variant='outline' className='flex-1' onClick={() => setStep(step - 1)}>
                        Atrás
                    </Button>
                )}
                {step < 3 ? (
                    <Button type='button' className='flex-1' onClick={() => {
                        const validationError = step === 2 ? validate() : null
                        if (validationError) {
                            setError(validationError)
                            return
                        }
                        setError(null)
                        setStep(step + 1)
                    }}>
                        Continuar
                    </Button>
                ) : (
                    <Button type='button' className='flex-1' onClick={submit} disabled={isPending}>
                        <CheckCircle2 className='h-4 w-4' />
                        {isPending ? 'Guardando...' : ctaLabel}
                    </Button>
                )}
            </div>
        </div>
    )
}

const Field = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
    <div className={`grid gap-2 ${className}`}>
        <Label>{label}</Label>
        {children}
    </div>
)

const WalletSelect = ({ wallets, value, onChange }: { wallets: Wallet[]; value: string; onChange: (value: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger className='h-12'><SelectValue placeholder='Selecciona' /></SelectTrigger>
        <SelectContent>
            {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
            ))}
        </SelectContent>
    </Select>
)

const Segmented = ({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) => (
    <div className='grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1 sm:grid-cols-2'>
        {options.map((option) => (
            <button
                key={option.value}
                type='button'
                onClick={() => onChange(option.value)}
                className={[
                    'rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                    value === option.value ? 'bg-sky-400 text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
                ].join(' ')}
            >
                {option.label}
            </button>
        ))}
    </div>
)

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className='flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
        <span className='text-sm text-slate-400'>{label}</span>
        <span className='text-right text-sm font-semibold text-white'>{value}</span>
    </div>
)
