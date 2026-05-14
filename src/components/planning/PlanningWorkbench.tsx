'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, CheckCircle2, CreditCard, PauseCircle, Pencil, PlusCircle, RotateCcw, Trash2, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Category, Transaction, Wallet } from '@/interfaces'
import {
  deleteOrCloseDebt,
  deleteOrDeactivateInstallmentPlan,
  deleteOrDeactivateScheduledPlan,
  createMovementFromForm,
  payDebt,
  payScheduledOccurrence,
  reopenInstallmentOccurrence,
  reopenScheduledOccurrence,
  skipScheduledOccurrence,
  updateDebt,
  updateInstallmentPlan,
  updateScheduledPlan,
} from '@/actions'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { PlanningCreateFlow } from './PlanningCreateFlow'
import { PlanningCycleHeader, PlanningDecisionSummary, PlanningMetricGrid, PlanningNavGrid, PlanningSectionHeader } from './PlanningPageSections'
import { EmptyState } from '@/components/layout/PagePrimitives'
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import { formatCurrency, getRecurrenceFrequencyLabel, getScheduledPlanKindLabel } from '@/utils'

type OccurrenceStatus = 'PENDIENTE' | 'EJECUTADA' | 'OMITIDA' | 'CANCELADA'
type CreditCardPaymentMode = 'CYCLE' | 'PARTIAL' | 'TOTAL'

interface CreditCardObligationView {
  walletId: string
  walletName: string
  statementStartsAt: string
  statementEndsAt: string
  paymentDueAt: string
  purchasesTotal: number
  installmentsTotal: number
  paymentsApplied: number
  totalDue: number
  pendingAmount: number
  installmentCount: number
}

interface ScheduledOccurrenceView {
  id: string
  dueAt: string
  expectedAmount: number
  status: OccurrenceStatus
  linkedTransactionId?: string
  plan: {
    id: string
    title: string
    description: string
    kind: string
    amountMode: 'FIJO' | 'VARIABLE'
    fixedAmount: number | null
    frequency: string
    dueDay: number | null
    sourceWalletId?: string
    categoryId?: string
    categoryName?: string
    affectsProjectedBudget: boolean
    isActive: boolean
  }
}

interface InstallmentOccurrenceView {
  id: string
  dueAt: string
  expectedAmount: number
  status: OccurrenceStatus
  linkedTransactionId?: string
  installmentNumber: number
  plan: {
    id: string
    title: string
    description?: string
    merchant?: string
    categoryId?: string
    categoryName?: string
    paymentWalletId?: string
    chargeWalletId?: string
    totalInstallments: number
    remainingInstallments: number
    isActive: boolean
  }
}

interface ScheduledPlanView {
  id: string
  title: string
  description: string
  kind: 'SUSCRIPCION' | 'SERVICIO' | 'PAGO_PROGRAMADO'
  amountMode: 'FIJO' | 'VARIABLE'
  fixedAmount: number | null
  frequency: 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
  dueDay: number | null
  startsAt: string
  categoryId?: string
  sourceWalletId?: string
  affectsProjectedBudget: boolean
  isActive: boolean
}

interface InstallmentPlanView {
  id: string
  title: string
  description?: string
  merchant?: string
  categoryId?: string
  chargeWalletId?: string
  paymentWalletId?: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments?: number
  importedPaidInstallments?: number
  remainingInstallments: number
  nextDueAt?: string
  occurredAt: string
  firstDueAt: string
  isActive: boolean
}

interface DebtView {
  id: string
  title: string
  personName: string
  direction: 'YO_DEBO' | 'ME_DEBEN'
  principalAmount: number
  currentBalance: number
  status: 'ACTIVA' | 'SALDADA'
  startedAt: string
  settledAt?: string
  notes?: string
  hasTransactions: boolean
  payments: Array<{
    id: string
    title: string
    amount: number
    occurredAt: string
  }>
}

interface PlanningWorkbenchProps {
  currentCycle: {
    startsAt: string
    endsAt: string
    label: string
  }
  wallets: Wallet[]
  categories: Category[]
  scheduledOccurrences: ScheduledOccurrenceView[]
  installmentOccurrences: InstallmentOccurrenceView[]
  creditCardObligations: CreditCardObligationView[]
  cardPaymentsInCycle: Transaction[]
  scheduledPlans: ScheduledPlanView[]
  installmentPlans: InstallmentPlanView[]
  debts: DebtView[]
  summary: {
    pendingScheduledTotal: number
    pendingInstallmentTotal: number
    pendingDebtTotal: number
    pendingCreditCardTotal: number
    totalObligations: number
    paidInCycle: number
    pendingCount: number
    paidCount: number
  }
  mode?: 'hub' | 'section'
  initialTab?: Tab
}

type Tab = 'pendientes' | 'pagados' | 'planes' | 'deudas' | 'crear'

const tabRoutes: Record<Tab, string> = {
  pendientes: '/planeacion/por-pagar',
  pagados: '/planeacion/pagado',
  planes: '/planeacion/planes',
  deudas: '/planeacion/deudas',
  crear: '/planeacion/crear',
}

const tabTitles: Record<Tab, { title: string; description: string }> = {
  pendientes: {
    title: 'Por pagar',
    description: 'Obligaciones pendientes de este ciclo.',
  },
  pagados: {
    title: 'Pagado',
    description: 'Pagos ejecutados, omitidos o cerrados en el ciclo.',
  },
  planes: {
    title: 'Planes',
    description: 'Pagos programados y compras a cuotas creadas.',
  },
  deudas: {
    title: 'Deudas',
    description: 'Deudas activas, saldos y abonos.',
  },
  crear: {
    title: 'Crear',
    description: 'Agrega pagos programados, deudas o compras a cuotas.',
  },
}

const toDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const toCycleQueryDate = (date: Date) => date.toISOString().slice(0, 10)

const getCycleNavDates = (startsAt: string, endsAt: string) => {
  const previous = new Date(startsAt)
  previous.setDate(previous.getDate() - 1)

  const next = new Date(endsAt)
  next.setSeconds(next.getSeconds() + 1)

  return {
    previous: toCycleQueryDate(previous),
    next: toCycleQueryDate(next),
  }
}

const statusLabel: Record<OccurrenceStatus, string> = {
  PENDIENTE: 'Pendiente',
  EJECUTADA: 'Pagado',
  OMITIDA: 'Omitido',
  CANCELADA: 'Cancelado',
}

const ActionError = ({ message }: { message: string | null }) => (
  message ? <Alert variant='destructive'><AlertDescription>{message}</AlertDescription></Alert> : null
)

const PayOccurrenceDialog = ({
  title,
  description,
  defaultAmount,
  amountMode,
  dueAt,
  wallets,
  defaultWalletId,
  onPay,
}: {
  title: string
  description: string
  defaultAmount: number
  amountMode: 'FIJO' | 'VARIABLE'
  dueAt: string
  wallets: Wallet[]
  defaultWalletId?: string
  onPay: (values: { walletId: string; amount?: number; occurredAt: string; description?: string }) => Promise<{ ok: boolean; message: string }>
}) => {
  const router = useRouter()
  const safeDefaultWalletId = defaultWalletId && wallets.some((wallet) => wallet.id === defaultWalletId) ? defaultWalletId : wallets[0]?.id ?? ''
  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState(safeDefaultWalletId)
  const [amount, setAmount] = useState(defaultAmount > 0 ? String(defaultAmount) : '')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal(dueAt))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
    setIsPending(true)
    try {
      const response = await onPay({
        walletId,
        amount: amount ? Number(amount) : undefined,
        occurredAt,
        description: note,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size='sm' disabled={wallets.length === 0} onClick={() => setOpen(true)}>
        <CheckCircle2 className='h-4 w-4' />
        Pagar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>Cuenta de pago</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger><SelectValue placeholder='Elige una cuenta' /></SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label>{amountMode === 'VARIABLE' ? 'Valor real' : 'Valor pagado'}</Label>
            <Input type='number' step='0.01' value={amount} onChange={(event) => setAmount(event.target.value)} placeholder='0' />
          </div>
          <div className='grid gap-2'>
            <Label>Fecha y hora</Label>
            <Input type='datetime-local' step='1' value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label>Nota</Label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder='Opcional' />
          </div>
          <ActionError message={error} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!walletId || isPending}>{isPending ? 'Registrando...' : 'Registrar pago'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const PayCreditCardObligationDialog = ({
  obligation,
  card,
  wallets,
}: {
  obligation: CreditCardObligationView
  card?: Wallet
  wallets: Wallet[]
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '')
  const [mode, setMode] = useState<CreditCardPaymentMode>('CYCLE')
  const [amount, setAmount] = useState(obligation.pendingAmount > 0 ? String(obligation.pendingAmount) : '')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal(obligation.paymentDueAt))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const cardDebt = card?.balance ?? 0
  const suggestedAmount = mode === 'TOTAL'
    ? cardDebt
    : mode === 'CYCLE'
      ? obligation.pendingAmount
      : Number(amount || 0)
  const effectiveAmount = mode === 'TOTAL' ? cardDebt : Number(amount || 0)

  const changeMode = (nextMode: CreditCardPaymentMode) => {
    setMode(nextMode)
    setError(null)
    if (nextMode === 'TOTAL') {
      setAmount(String(cardDebt))
      return
    }
    if (nextMode === 'CYCLE') {
      setAmount(String(obligation.pendingAmount))
    }
  }

  const submit = async () => {
    setError(null)

    if (!walletId) {
      setError('Selecciona la cuenta desde la que vas a pagar')
      return
    }

    if (mode !== 'TOTAL' && (!Number.isFinite(effectiveAmount) || effectiveAmount <= 0)) {
      setError('El monto del pago debe ser mayor a 0')
      return
    }

    setIsPending(true)
    try {
      const response = await createMovementFromForm({
        kind: 'CARD_PAYMENT',
        title: mode === 'CYCLE' ? `Pago corte ${obligation.walletName}` : `Pago tarjeta ${obligation.walletName}`,
        description: note,
        occurredAt,
        paymentMode: mode === 'TOTAL' ? 'TOTAL' : 'PARCIAL',
        fromWalletId: walletId,
        cardWalletId: obligation.walletId,
        amount: mode === 'TOTAL' ? undefined : effectiveAmount,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size='sm' disabled={wallets.length === 0 || !card || cardDebt <= 0} onClick={() => setOpen(true)}>
        <CheckCircle2 className='h-4 w-4' />
        Pagar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar {obligation.walletName}</DialogTitle>
          <DialogDescription>
            Estado de cuenta {format(parseISO(obligation.statementStartsAt), 'd MMM', { locale: es })} - {format(parseISO(obligation.statementEndsAt), 'd MMM yyyy', { locale: es })}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-sm text-slate-400'>Pago mínimo pendiente</span>
              <CurrencyDisplay amount={obligation.pendingAmount} showDecimals={true} className='font-semibold text-white' />
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-sm text-slate-400'>Deuda total tarjeta</span>
              <CurrencyDisplay amount={cardDebt} showDecimals={true} className='font-semibold text-sky-100' />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Tipo de pago</Label>
            <div className='grid gap-2 sm:grid-cols-3'>
              {[
                { id: 'CYCLE' as const, label: 'Pagar corte', amount: obligation.pendingAmount },
                { id: 'PARTIAL' as const, label: 'Otro abono', amount: suggestedAmount },
                { id: 'TOTAL' as const, label: 'Pago total', amount: cardDebt },
              ].map((option) => (
                <button
                  key={option.id}
                  type='button'
                  onClick={() => changeMode(option.id)}
                  disabled={option.id === 'TOTAL' && cardDebt <= 0}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${mode === option.id ? 'border-sky-300/70 bg-sky-400/15 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span className='block text-sm font-semibold'>{option.label}</span>
                  <span className='mt-1 block text-xs text-slate-500'>{formatCurrency(option.id === 'PARTIAL' ? Number(amount || 0) : option.amount)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Cuenta origen</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger><SelectValue placeholder='Elige una cuenta' /></SelectTrigger>
              <SelectContent>{wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Monto</Label>
              <Input type='number' step='0.01' value={amount} onChange={(event) => setAmount(event.target.value)} disabled={mode === 'TOTAL'} />
            </div>
            <div className='grid gap-2'>
              <Label>Fecha y hora</Label>
              <Input type='datetime-local' step='1' value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Nota</Label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder='Opcional' />
          </div>

          <ActionError message={error} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!walletId || isPending || (mode !== 'TOTAL' && effectiveAmount <= 0)}>
            {isPending ? 'Registrando...' : mode === 'TOTAL' ? 'Pagar todo' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CreditCardObligationCard = ({
  obligation,
  card,
  wallets,
}: {
  obligation: CreditCardObligationView
  card?: Wallet
  wallets: Wallet[]
}) => (
  <article className='overflow-hidden rounded-[1.75rem] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0.78)_46%,rgba(2,6,23,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='rounded-full border border-sky-200/20 bg-sky-300/10 p-2 text-sky-100'>
            <CreditCard className='h-4 w-4' />
          </span>
          <div>
            <p className='font-semibold text-white'>Pago tarjeta: {obligation.walletName}</p>
            <p className='text-sm text-slate-400'>
              Fecha límite de pago {format(parseISO(obligation.paymentDueAt), "d MMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className='mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4'>
          <span className='rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2'>Corte asignado {format(parseISO(obligation.statementEndsAt), 'd MMM', { locale: es })}</span>
          <span className='rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2'>Pago mínimo {formatCurrency(obligation.totalDue)}</span>
          <span className='rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2'>Compras {formatCurrency(obligation.purchasesTotal)}</span>
          <span className='rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2'>{obligation.installmentCount} cuotas {formatCurrency(obligation.installmentsTotal)}</span>
          <span className='rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2'>Abonos {formatCurrency(obligation.paymentsApplied)}</span>
        </div>
      </div>
      <div className='shrink-0 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 lg:min-w-56'>
        <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Pago mínimo pendiente</p>
        <CurrencyDisplay amount={obligation.pendingAmount} showDecimals={true} className='mt-1 text-2xl font-bold text-white' />
        <div className='mt-4 flex flex-wrap gap-2'>
          <PayCreditCardObligationDialog obligation={obligation} card={card} wallets={wallets} />
          {card && card.balance > obligation.pendingAmount && (
            <span className='rounded-full bg-white/[0.06] px-3 py-2 text-xs text-slate-300'>
              Deuda total {formatCurrency(card.balance)}
            </span>
          )}
        </div>
      </div>
    </div>
  </article>
)

const OccurrenceCard = ({
  title,
  subtitle,
  amount,
  dueAt,
  status,
  children,
}: {
  title: string
  subtitle: string
  amount: number
  dueAt: string
  status: OccurrenceStatus
  children: React.ReactNode
}) => (
  <article className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'>
    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='truncate font-semibold text-white'>{title}</p>
          <span className='rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300'>
            {statusLabel[status]}
          </span>
        </div>
        <p className='mt-1 text-sm text-slate-400'>{subtitle}</p>
        <p className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
          <CalendarClock className='h-3.5 w-3.5' />
          {format(parseISO(dueAt), "d MMM yyyy · HH:mm:ss", { locale: es })}
        </p>
      </div>
      <CurrencyDisplay amount={amount} showDecimals={true} className='text-lg font-bold text-white' />
    </div>
    <div className='mt-4 flex flex-wrap gap-2'>{children}</div>
  </article>
)

const PlanEditDialog = ({
  plan,
  categories,
  wallets,
}: {
  plan: ScheduledPlanView | InstallmentPlanView
  categories: Category[]
  wallets: Wallet[]
}) => {
  const router = useRouter()
  const isScheduledPlan = 'amountMode' in plan
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(plan.title)
  const [description, setDescription] = useState(plan.description ?? '')
  const [categoryId, setCategoryId] = useState(plan.categoryId ?? 'none')
  const [walletId, setWalletId] = useState((isScheduledPlan ? plan.sourceWalletId : plan.paymentWalletId) ?? 'none')
  const [amount, setAmount] = useState(isScheduledPlan && plan.fixedAmount !== null ? String(plan.fixedAmount) : '')
  const [dueDay, setDueDay] = useState(isScheduledPlan && plan.dueDay ? String(plan.dueDay) : '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
    setIsPending(true)
    try {
      const response = isScheduledPlan
        ? await updateScheduledPlan({
            id: plan.id,
            title,
            description,
            fixedAmount: plan.amountMode === 'FIJO' ? Number(amount) : null,
            dueDay: dueDay ? Number(dueDay) : null,
            categoryId: categoryId === 'none' ? null : categoryId,
            sourceWalletId: walletId === 'none' ? null : walletId,
          })
        : await updateInstallmentPlan({
            id: plan.id,
            title,
            description,
            categoryId: categoryId === 'none' ? null : categoryId,
            paymentWalletId: walletId === 'none' ? null : walletId,
          })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Pencil className='h-4 w-4' />
        Editar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar plan</DialogTitle>
          <DialogDescription>Ajusta lo operativo sin tocar los movimientos históricos.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>Título</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          {isScheduledPlan && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label>Monto fijo</Label>
                <Input type='number' step='0.01' value={amount} onChange={(event) => setAmount(event.target.value)} disabled={plan.amountMode === 'VARIABLE'} />
              </div>
              <div className='grid gap-2'>
                <Label>Día de pago</Label>
                <Input type='number' min='1' max='31' value={dueDay} onChange={(event) => setDueDay(event.target.value)} />
              </div>
            </div>
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin categoría</SelectItem>
                  {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Cuenta sugerida</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin cuenta</SelectItem>
                  {wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ActionError message={error} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DebtPayDialog = ({ debt, wallets }: { debt: DebtView; wallets: Wallet[] }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal())
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
    setIsPending(true)
    try {
      const response = await payDebt({
        debtId: debt.id,
        walletId,
        amount: Number(amount),
        occurredAt,
        description,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size='sm' disabled={debt.status === 'SALDADA' || wallets.length === 0} onClick={() => setOpen(true)}>
        <CheckCircle2 className='h-4 w-4' />
        Abonar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{debt.title}</DialogTitle>
          <DialogDescription>
            {debt.direction === 'YO_DEBO' ? `Pago a ${debt.personName}` : `Recibo de ${debt.personName}`}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>Cuenta</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger><SelectValue placeholder='Elige una cuenta' /></SelectTrigger>
              <SelectContent>{wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label>Monto</Label>
            <Input type='number' step='0.01' value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={String(debt.currentBalance)} />
          </div>
          <div className='grid gap-2'>
            <Label>Fecha y hora</Label>
            <Input type='datetime-local' step='1' value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label>Nota</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Opcional' />
          </div>
          <ActionError message={error} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!walletId || !amount || isPending}>{isPending ? 'Registrando...' : 'Registrar abono'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DebtEditDialog = ({ debt }: { debt: DebtView }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [personName, setPersonName] = useState(debt.personName)
  const [title, setTitle] = useState(debt.title)
  const [notes, setNotes] = useState(debt.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
    setIsPending(true)
    try {
      const response = await updateDebt({
        id: debt.id,
        personName,
        title,
        notes: notes || null,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Pencil className='h-4 w-4' />
        Editar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar deuda</DialogTitle>
          <DialogDescription>Corrige la persona, el nombre o notas sin alterar abonos históricos.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>Persona</Label>
            <Input value={personName} onChange={(event) => setPersonName(event.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label>Título</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder='Opcional' />
          </div>
          <ActionError message={error} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!personName.trim() || !title.trim() || isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DebtProgress = ({ debt }: { debt: DebtView }) => {
  const paid = Math.max(debt.principalAmount - debt.currentBalance, 0)
  const progress = debt.principalAmount > 0 ? Math.min(100, Math.max(0, (paid / debt.principalAmount) * 100)) : 0

  return (
    <div className='mt-4 space-y-2'>
      <div className='flex justify-between gap-3 text-xs text-slate-500'>
        <span>Abonado {formatCurrency(paid)}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-white/[0.06]'>
        <div className='h-full rounded-full bg-sky-400' style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export const PlanningWorkbench = ({
  currentCycle,
  wallets,
  categories,
  scheduledOccurrences,
  installmentOccurrences,
  creditCardObligations,
  cardPaymentsInCycle,
  scheduledPlans,
  installmentPlans,
  debts,
  summary,
  mode = 'section',
  initialTab = 'pendientes',
}: PlanningWorkbenchProps) => {
  const router = useRouter()
  const [activeTab] = useState<Tab>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const activeDebts = debts.filter((debt) => debt.status === 'ACTIVA')
  const walletById = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets])
  const paymentWallets = useMemo(() => wallets.filter((wallet) => wallet.isActive && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte'), [wallets])
  const cycleNavDates = useMemo(() => getCycleNavDates(currentCycle.startsAt, currentCycle.endsAt), [currentCycle.startsAt, currentCycle.endsAt])
  const realAccountAvailable = wallets
    .filter((wallet) => wallet.includeInTotal && wallet.type !== 'Tarjeta de Crédito')
    .reduce((sum, wallet) => sum + wallet.balance, 0)
  const cardDueThisCycle = summary.pendingCreditCardTotal ?? summary.pendingInstallmentTotal
  const otherObligations = summary.pendingScheduledTotal + summary.pendingDebtTotal
  const projectedAvailable = realAccountAvailable - cardDueThisCycle - otherObligations
  const cycleQuery = toCycleQueryDate(new Date(currentCycle.startsAt))
  const withCycle = (path: string, cycle = cycleQuery) => `${path}?cycle=${cycle}`
  const currentRoute = mode === 'hub' ? '/planeacion' : tabRoutes[activeTab]
  const pendingCreditCardCount = creditCardObligations.filter((obligation) => obligation.pendingAmount > 0).length
  const pendingTotalCount = summary.pendingCount + pendingCreditCardCount

  const pendingItems = useMemo(() => [
    ...scheduledOccurrences.filter((occurrence) => occurrence.status === 'PENDIENTE').map((occurrence) => ({ kind: 'scheduled' as const, occurrence })),
  ].sort((a, b) => new Date(a.occurrence.dueAt).getTime() - new Date(b.occurrence.dueAt).getTime()), [scheduledOccurrences])

  const paidItems = useMemo(() => [
    ...scheduledOccurrences.filter((occurrence) => occurrence.status !== 'PENDIENTE').map((occurrence) => ({ kind: 'scheduled' as const, occurrence })),
    ...installmentOccurrences.filter((occurrence) => occurrence.status !== 'PENDIENTE').map((occurrence) => ({ kind: 'installment' as const, occurrence })),
  ].sort((a, b) => new Date(a.occurrence.dueAt).getTime() - new Date(b.occurrence.dueAt).getTime()), [scheduledOccurrences, installmentOccurrences])

  const runAction = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    setError(null)
    const response = await action()
    if (!response.ok) {
      setError(response.message)
      return
    }
    router.refresh()
  }

  const walletName = (walletId?: string) => walletId ? walletById.get(walletId)?.name ?? 'Cuenta no disponible' : 'Sin cuenta sugerida'

  const CycleHeader = (
    <PlanningCycleHeader
      label={currentCycle.label}
      previousHref={withCycle(currentRoute, cycleNavDates.previous)}
      todayHref={currentRoute}
      nextHref={withCycle(currentRoute, cycleNavDates.next)}
    />
  )

  if (mode === 'hub') {
    const navCards = [
      {
        tab: 'pendientes' as const,
        title: 'Por pagar',
        description: `${pendingTotalCount} pendientes del ciclo`,
        value: formatCurrency(summary.totalObligations),
        icon: <CalendarClock className='h-5 w-5' />,
        tone: 'text-amber-100 bg-amber-400/12 border-amber-200/20',
      },
      {
        tab: 'pagados' as const,
        title: 'Pagado',
        description: `${summary.paidCount + cardPaymentsInCycle.length} registros del ciclo`,
        value: formatCurrency(summary.paidInCycle),
        icon: <CheckCircle2 className='h-5 w-5' />,
        tone: 'text-emerald-100 bg-emerald-400/12 border-emerald-200/20',
      },
      {
        tab: 'planes' as const,
        title: 'Planes',
        description: 'Programados y cuotas',
        value: `${scheduledPlans.length + installmentPlans.length}`,
        icon: <WalletCards className='h-5 w-5' />,
        tone: 'text-sky-100 bg-sky-400/12 border-sky-200/20',
      },
      {
        tab: 'deudas' as const,
        title: 'Deudas',
        description: 'Saldos y abonos',
        value: `${activeDebts.length}`,
        icon: <CreditCard className='h-5 w-5' />,
        tone: 'text-rose-100 bg-rose-400/12 border-rose-200/20',
      },
      {
        tab: 'crear' as const,
        title: 'Crear',
        description: 'Pago, deuda o compra a cuotas',
        value: 'Nuevo',
        icon: <PlusCircle className='h-5 w-5' />,
        tone: 'text-white bg-sky-500/20 border-sky-200/25',
      },
    ].map((card) => ({
      key: card.tab,
      href: withCycle(tabRoutes[card.tab]),
      title: card.title,
      description: card.description,
      value: card.value,
      icon: card.icon,
      tone: card.tone,
    }))

    return (
      <div className='space-y-5'>
        {CycleHeader}

        <PlanningDecisionSummary totalObligations={summary.totalObligations} projectedAvailable={projectedAvailable} />

        <PlanningNavGrid cards={navCards} />

        <PlanningMetricGrid
          metrics={[
            { label: 'Cuentas reales', amount: realAccountAvailable, className: 'text-white' },
            { label: 'Tarjeta mes', amount: cardDueThisCycle, className: 'text-sky-200' },
            { label: 'Otros deberes', amount: otherObligations, className: 'text-amber-300' },
          ]}
        />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {CycleHeader}

      <PlanningSectionHeader
        backHref={withCycle('/planeacion')}
        title={tabTitles[activeTab].title}
        description={tabTitles[activeTab].description}
      />

      <div className='rounded-[1.5rem] border border-sky-300/10 bg-sky-400/[0.06] p-4 text-sm text-sky-100'>
        Planeación cruza tus cuentas reales con pagos programados, deudas y cuotas de tarjeta que vencen en este ciclo. El cupo de la tarjeta no se suma como dinero disponible.
      </div>

      <ActionError message={error} />

      {paymentWallets.length === 0 && (
        <Alert>
          <AlertDescription>Necesitas al menos una cuenta para marcar pagos, cuotas o deudas como ejecutadas.</AlertDescription>
        </Alert>
      )}

      {activeTab === 'pendientes' && (
        <section className='grid gap-3'>
          {pendingItems.length === 0 && creditCardObligations.filter((obligation) => obligation.pendingAmount > 0).length === 0 ? (
            <EmptyState title='Sin obligaciones pendientes' description='No hay obligaciones pendientes para este ciclo.' />
          ) : (
            <>
              {creditCardObligations.filter((obligation) => obligation.pendingAmount > 0).map((obligation) => (
                <CreditCardObligationCard
                  key={obligation.walletId}
                  obligation={obligation}
                  card={walletById.get(obligation.walletId)}
                  wallets={paymentWallets}
                />
              ))}
              {pendingItems.map((item) => {
            if (item.kind === 'scheduled') {
              const occurrence = item.occurrence
              return (
                <OccurrenceCard
                  key={occurrence.id}
                  title={occurrence.plan.title}
                  subtitle={`${getScheduledPlanKindLabel(occurrence.plan.kind)} · ${occurrence.plan.amountMode === 'VARIABLE' ? 'Variable' : occurrence.plan.categoryName ?? 'Programado'}`}
                  amount={occurrence.expectedAmount}
                  dueAt={occurrence.dueAt}
                  status={occurrence.status}
                >
                  <PayOccurrenceDialog
                    title={occurrence.plan.title}
                    description={occurrence.plan.amountMode === 'VARIABLE' ? 'Ingresa el valor real antes de registrarlo.' : 'Confirma cuenta, fecha y hora del pago.'}
                    defaultAmount={occurrence.expectedAmount}
                    amountMode={occurrence.plan.amountMode}
                    dueAt={occurrence.dueAt}
                    wallets={paymentWallets}
                    defaultWalletId={occurrence.plan.sourceWalletId}
                    onPay={(values) => payScheduledOccurrence({ occurrenceId: occurrence.id, ...values })}
                  />
                  <Button variant='outline' size='sm' onClick={() => runAction(() => skipScheduledOccurrence(occurrence.id))}>
                    <PauseCircle className='h-4 w-4' />
                    Omitir
                  </Button>
                </OccurrenceCard>
              )
            }

            return null
          })}
            </>
          )}
        </section>
      )}

      {activeTab === 'pagados' && (
        <section className='grid gap-3'>
          {paidItems.length === 0 && cardPaymentsInCycle.length === 0 ? (
            <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
              <p className='text-sm text-slate-400'>Aún no hay pagos ejecutados u omitidos en este ciclo.</p>
            </div>
          ) : (
            <>
              {cardPaymentsInCycle.map((payment) => (
                <OccurrenceCard
                  key={payment.id}
                  title={payment.title}
                  subtitle={`Abono tarjeta · ${walletName(payment.fromWalletId)} -> ${walletName(payment.toWalletId)}`}
                  amount={Math.abs(payment.amount)}
                  dueAt={payment.occurredAt}
                  status='EJECUTADA'
                >
                  <span className='rounded-full bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200'>Pago real</span>
                </OccurrenceCard>
              ))}
              {paidItems.map((item) => {
            const occurrence = item.occurrence
            const isScheduled = item.kind === 'scheduled'
            const subtitle = isScheduled
              ? 'Pago programado'
              : `${occurrence.status === 'EJECUTADA' && !occurrence.linkedTransactionId ? 'Importada o cerrada' : 'Pago de tarjeta'} · ${walletName(item.occurrence.plan.chargeWalletId)} · Cuota ${item.occurrence.installmentNumber} de ${item.occurrence.plan.totalInstallments}`

            return (
              <OccurrenceCard key={occurrence.id} title={occurrence.plan.title} subtitle={subtitle} amount={occurrence.expectedAmount} dueAt={occurrence.dueAt} status={occurrence.status}>
                {occurrence.status === 'OMITIDA' && (
                  <Button variant='outline' size='sm' onClick={() => runAction(() => isScheduled ? reopenScheduledOccurrence(occurrence.id) : reopenInstallmentOccurrence(occurrence.id))}>
                    <RotateCcw className='h-4 w-4' />
                    Reabrir
                  </Button>
                )}
                {occurrence.linkedTransactionId && <span className='rounded-full bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200'>Movimiento vinculado</span>}
                {!occurrence.linkedTransactionId && !isScheduled && occurrence.status === 'EJECUTADA' && <span className='rounded-full bg-sky-400/10 px-3 py-2 text-xs text-sky-100'>Liquidada con pago total</span>}
              </OccurrenceCard>
            )
          })}
            </>
          )}
        </section>
      )}

      {activeTab === 'planes' && (
        <section className='grid gap-4'>
          <div className='glass-panel rounded-[1.75rem] p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-white'>Planes activos e históricos</h2>
                <p className='mt-1 text-sm text-slate-400'>Pagos programados y compras a cuotas ya creadas.</p>
              </div>
              <Button type='button' asChild><Link href={withCycle('/planeacion/crear')}>Crear plan</Link></Button>
            </div>
          </div>

          <div className='grid gap-3'>
            {[...scheduledPlans, ...installmentPlans].length === 0 ? (
              <div className='rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400'>No tienes planes creados. Usa la pestaña Crear para pagos programados o registra una compra con tarjeta a cuotas desde Nuevo movimiento.</div>
            ) : (
              <>
                {scheduledPlans.map((plan) => (
                  <article key={plan.id} className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4'>
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div>
                        <p className='font-semibold text-white'>{plan.title}</p>
                        <p className='mt-1 text-sm text-slate-400'>{getScheduledPlanKindLabel(plan.kind)} · {getRecurrenceFrequencyLabel(plan.frequency)} · {plan.amountMode === 'VARIABLE' ? 'Variable' : formatCurrency(plan.fixedAmount ?? 0)}</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <PlanEditDialog plan={plan} categories={categories} wallets={paymentWallets} />
                        <Button variant='outline' size='sm' onClick={() => runAction(() => updateScheduledPlan({ id: plan.id, isActive: !plan.isActive }))}>
                          <PauseCircle className='h-4 w-4' />
                          {plan.isActive ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button variant='destructive' size='sm' onClick={() => runAction(() => deleteOrDeactivateScheduledPlan(plan.id))}>
                          <Trash2 className='h-4 w-4' />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
                {installmentPlans.map((plan) => (
                  <article key={plan.id} className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4'>
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div>
                        <p className='font-semibold text-white'>{plan.title}</p>
                        <p className='mt-1 text-sm text-slate-400'>
                          {plan.remainingInstallments === 0 ? `${plan.totalInstallments} de ${plan.totalInstallments} liquidadas` : `${plan.remainingInstallments} de ${plan.totalInstallments} pendientes`} · {formatCurrency(plan.installmentAmount)}
                        </p>
                        <p className='mt-1 text-xs text-slate-500'>
                          Tarjeta {walletName(plan.chargeWalletId)} · Pago con {walletName(plan.paymentWalletId)}
                        </p>
                        <p className='mt-1 text-xs text-slate-500'>
                          {plan.paidInstallments ?? 0} pagadas
                          {(plan.importedPaidInstallments ?? 0) > 0 ? ` · ${plan.importedPaidInstallments} importadas` : ''}
                          {plan.nextDueAt ? ` · Próxima cuota ${format(parseISO(plan.nextDueAt), "d MMM yyyy", { locale: es })}` : ' · Sin próximas cuotas pendientes'}
                        </p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <PlanEditDialog plan={plan} categories={categories} wallets={paymentWallets} />
                        <Button variant='outline' size='sm' onClick={() => runAction(() => updateInstallmentPlan({ id: plan.id, isActive: !plan.isActive }))}>
                          <PauseCircle className='h-4 w-4' />
                          {plan.isActive ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button variant='destructive' size='sm' onClick={() => runAction(() => deleteOrDeactivateInstallmentPlan(plan.id))}>
                          <Trash2 className='h-4 w-4' />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {activeTab === 'deudas' && (
        <section className='grid gap-4'>
          <div className='glass-panel rounded-[1.75rem] p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-white'>Deudas y abonos</h2>
                <p className='mt-1 text-sm text-slate-400'>Registra abonos parciales sin mezclarlo con pagos programados.</p>
              </div>
              <Button type='button' asChild><Link href={withCycle('/planeacion/crear')}>Nueva deuda</Link></Button>
            </div>
          </div>
          <div className='grid gap-3'>
            {debts.length === 0 ? (
              <div className='glass-panel rounded-[1.75rem] p-8 text-center text-sm text-slate-400'>No hay deudas registradas.</div>
            ) : debts.map((debt) => (
              <article key={debt.id} className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-semibold text-white'>{debt.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${debt.direction === 'YO_DEBO' ? 'bg-rose-400/12 text-rose-100' : 'bg-emerald-400/12 text-emerald-100'}`}>
                        {debt.direction === 'YO_DEBO' ? 'Yo debo' : 'Me deben'}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-slate-400'>
                      {debt.direction === 'YO_DEBO' ? `Le debes a ${debt.personName}` : `${debt.personName} te debe`}
                    </p>
                    <p className='mt-2 text-xs text-slate-500'>
                      {debt.status === 'SALDADA' ? 'Saldada' : 'Activa'} · Capital {formatCurrency(debt.principalAmount)}
                    </p>
                  </div>
                  <div className='text-left sm:text-right'>
                    <p className='text-xs uppercase tracking-[0.2em] text-slate-500'>Pendiente</p>
                    <CurrencyDisplay amount={debt.currentBalance} showDecimals={true} className='text-lg font-bold text-white' />
                  </div>
                </div>
                <DebtProgress debt={debt} />
                {debt.payments.length > 0 && (
                  <div className='mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3'>
                    <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Últimos abonos</p>
                    <div className='mt-3 grid gap-2'>
                      {debt.payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className='flex items-center justify-between gap-3 text-sm'>
                          <span className='truncate text-slate-300'>{payment.title}</span>
                          <span className='shrink-0 text-slate-500'>
                            {format(parseISO(payment.occurredAt), 'd MMM', { locale: es })} · {formatCurrency(Math.abs(payment.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className='mt-4 flex flex-wrap gap-2'>
                  <DebtPayDialog debt={debt} wallets={paymentWallets} />
                  <DebtEditDialog debt={debt} />
                  <Button variant='destructive' size='sm' onClick={() => runAction(() => deleteOrCloseDebt(debt.id))}>
                    <Trash2 className='h-4 w-4' />
                    {debt.hasTransactions ? 'Cerrar' : 'Eliminar'}
                  </Button>
                </div>
              </article>
            ))}
            {activeDebts.length > 0 && (
              <div className='rounded-[1.5rem] border border-sky-300/10 bg-sky-400/[0.06] p-4 text-sm text-sky-100'>
                <WalletCards className='mr-2 inline h-4 w-4' />
                Las deudas activas también cuentan para el disponible proyectado de tu ciclo.
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'crear' && (
        <PlanningCreateFlow categories={categories} wallets={paymentWallets} />
      )}
    </div>
  )
}
