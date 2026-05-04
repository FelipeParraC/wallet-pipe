'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, CheckCircle2, PauseCircle, Pencil, RotateCcw, Trash2, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Category, Wallet } from '@/interfaces'
import {
  deleteOrCloseDebt,
  deleteOrDeactivateInstallmentPlan,
  deleteOrDeactivateScheduledPlan,
  payDebt,
  payInstallmentOccurrence,
  payScheduledOccurrence,
  reopenInstallmentOccurrence,
  reopenScheduledOccurrence,
  skipInstallmentOccurrence,
  skipScheduledOccurrence,
  updateDebt,
  updateInstallmentPlan,
  updateScheduledPlan,
} from '@/actions'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { DebtForm, ScheduledPlanForm } from '@/components'
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import { formatCurrency } from '@/utils'

type OccurrenceStatus = 'PENDIENTE' | 'EJECUTADA' | 'OMITIDA' | 'CANCELADA'

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
  paymentWalletId?: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments?: number
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
}

interface PlanningWorkbenchProps {
  currentCycleLabel: string
  wallets: Wallet[]
  categories: Category[]
  scheduledOccurrences: ScheduledOccurrenceView[]
  installmentOccurrences: InstallmentOccurrenceView[]
  scheduledPlans: ScheduledPlanView[]
  installmentPlans: InstallmentPlanView[]
  debts: DebtView[]
  summary: {
    pendingScheduledTotal: number
    pendingInstallmentTotal: number
    pendingDebtTotal: number
    paidInCycle: number
    pendingCount: number
    paidCount: number
  }
}

type Tab = 'pendientes' | 'pagados' | 'planes' | 'deudas' | 'crear'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'pagados', label: 'Pagados' },
  { id: 'planes', label: 'Planes' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'crear', label: 'Crear' },
]

const toDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState(defaultWalletId ?? wallets[0]?.id ?? '')
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
      <Button size='sm' onClick={() => setOpen(true)}>
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
      <Button size='sm' disabled={debt.status === 'SALDADA'} onClick={() => setOpen(true)}>
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

export const PlanningWorkbench = ({
  currentCycleLabel,
  wallets,
  categories,
  scheduledOccurrences,
  installmentOccurrences,
  scheduledPlans,
  installmentPlans,
  debts,
  summary,
}: PlanningWorkbenchProps) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('pendientes')
  const [error, setError] = useState<string | null>(null)
  const activeDebts = debts.filter((debt) => debt.status === 'ACTIVA')
  const realAccountAvailable = wallets
    .filter((wallet) => wallet.includeInTotal && wallet.type !== 'Tarjeta de Crédito')
    .reduce((sum, wallet) => sum + wallet.balance, 0)
  const cardDueThisCycle = summary.pendingInstallmentTotal
  const otherObligations = summary.pendingScheduledTotal + summary.pendingDebtTotal
  const projectedAvailable = realAccountAvailable - cardDueThisCycle - otherObligations

  const pendingItems = useMemo(() => [
    ...scheduledOccurrences.filter((occurrence) => occurrence.status === 'PENDIENTE').map((occurrence) => ({ kind: 'scheduled' as const, occurrence })),
    ...installmentOccurrences.filter((occurrence) => occurrence.status === 'PENDIENTE').map((occurrence) => ({ kind: 'installment' as const, occurrence })),
  ].sort((a, b) => new Date(a.occurrence.dueAt).getTime() - new Date(b.occurrence.dueAt).getTime()), [scheduledOccurrences, installmentOccurrences])

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

  return (
    <div className='space-y-6'>
      <section className='glass-panel rounded-[2rem] p-5 sm:p-6'>
        <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Planeación</p>
        <div className='mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white md:text-3xl'>Centro del ciclo</h1>
            <p className='mt-1 text-sm text-slate-400'>{currentCycleLabel}</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className='grid gap-4 md:grid-cols-4'>
        <div className='glass-panel rounded-[1.5rem] p-4'>
          <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Cuentas reales</p>
          <CurrencyDisplay amount={realAccountAvailable} showDecimals={true} className='mt-2 text-xl font-bold text-white' />
        </div>
        <div className='glass-panel rounded-[1.5rem] p-4'>
          <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Tarjeta mes</p>
          <CurrencyDisplay amount={cardDueThisCycle} showDecimals={true} className='mt-2 text-xl font-bold text-sky-200' />
        </div>
        <div className='glass-panel rounded-[1.5rem] p-4'>
          <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Otros deberes</p>
          <CurrencyDisplay amount={otherObligations} showDecimals={true} className='mt-2 text-xl font-bold text-amber-300' />
        </div>
        <div className='glass-panel rounded-[1.5rem] p-4'>
          <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Disponible ciclo</p>
          <CurrencyDisplay amount={projectedAvailable} showDecimals={true} className='mt-2 text-xl font-bold text-emerald-300' />
        </div>
      </div>

      <div className='rounded-[1.5rem] border border-sky-300/10 bg-sky-400/[0.06] p-4 text-sm text-sky-100'>
        Planeación cruza tus cuentas reales con pagos programados, deudas y cuotas de tarjeta que vencen en este ciclo. El cupo de la tarjeta no se suma como dinero disponible.
      </div>

      <ActionError message={error} />

      {wallets.length === 0 && (
        <Alert>
          <AlertDescription>Necesitas al menos una cuenta para marcar pagos, cuotas o deudas como ejecutadas.</AlertDescription>
        </Alert>
      )}

      {activeTab === 'pendientes' && (
        <section className='grid gap-3'>
          {pendingItems.length === 0 ? (
            <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
              <p className='text-sm text-slate-400'>No hay obligaciones pendientes para este ciclo.</p>
            </div>
          ) : pendingItems.map((item) => {
            if (item.kind === 'scheduled') {
              const occurrence = item.occurrence
              return (
                <OccurrenceCard
                  key={occurrence.id}
                  title={occurrence.plan.title}
                  subtitle={`${occurrence.plan.kind} · ${occurrence.plan.amountMode === 'VARIABLE' ? 'Variable' : occurrence.plan.categoryName ?? 'Programado'}`}
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
                    wallets={wallets}
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

            const occurrence = item.occurrence
            return (
              <OccurrenceCard
                key={occurrence.id}
                title={occurrence.plan.title}
                subtitle={`Pago de tarjeta · Cuota ${occurrence.installmentNumber} de ${occurrence.plan.totalInstallments}${occurrence.plan.merchant ? ` · ${occurrence.plan.merchant}` : ''}`}
                amount={occurrence.expectedAmount}
                dueAt={occurrence.dueAt}
                status={occurrence.status}
              >
                <PayOccurrenceDialog
                  title={occurrence.plan.title}
                  description='Registra la cuota pagada con la cuenta correcta.'
                  defaultAmount={occurrence.expectedAmount}
                  amountMode='FIJO'
                  dueAt={occurrence.dueAt}
                  wallets={wallets}
                  defaultWalletId={occurrence.plan.paymentWalletId}
                  onPay={(values) => payInstallmentOccurrence({ occurrenceId: occurrence.id, ...values })}
                />
                <Button variant='outline' size='sm' onClick={() => runAction(() => skipInstallmentOccurrence(occurrence.id))}>
                  <PauseCircle className='h-4 w-4' />
                  Omitir
                </Button>
              </OccurrenceCard>
            )
          })}
        </section>
      )}

      {activeTab === 'pagados' && (
        <section className='grid gap-3'>
          {paidItems.length === 0 ? (
            <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
              <p className='text-sm text-slate-400'>Aún no hay pagos ejecutados u omitidos en este ciclo.</p>
            </div>
          ) : paidItems.map((item) => {
            const occurrence = item.occurrence
            const isScheduled = item.kind === 'scheduled'
            const subtitle = isScheduled
              ? 'Pago programado'
              : `${occurrence.status === 'EJECUTADA' && !occurrence.linkedTransactionId ? 'Importada o cerrada' : 'Pago de tarjeta'} · Cuota ${item.occurrence.installmentNumber} de ${item.occurrence.plan.totalInstallments}`

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
              <Button type='button' onClick={() => setActiveTab('crear')}>Crear plan</Button>
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
                        <p className='mt-1 text-sm text-slate-400'>{plan.kind} · {plan.frequency} · {plan.amountMode === 'VARIABLE' ? 'Variable' : formatCurrency(plan.fixedAmount ?? 0)}</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <PlanEditDialog plan={plan} categories={categories} wallets={wallets} />
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
                          {plan.paidInstallments ?? 0} pagadas
                          {plan.nextDueAt ? ` · Próxima cuota ${format(parseISO(plan.nextDueAt), "d MMM yyyy", { locale: es })}` : ' · Sin próximas cuotas pendientes'}
                        </p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <PlanEditDialog plan={plan} categories={categories} wallets={wallets} />
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
              <Button type='button' onClick={() => setActiveTab('crear')}>Nueva deuda</Button>
            </div>
          </div>
          <div className='grid gap-3'>
            {debts.length === 0 ? (
              <div className='glass-panel rounded-[1.75rem] p-8 text-center text-sm text-slate-400'>No hay deudas registradas.</div>
            ) : debts.map((debt) => (
              <article key={debt.id} className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <p className='font-semibold text-white'>{debt.title}</p>
                    <p className='mt-1 text-sm text-slate-400'>
                      {debt.direction === 'YO_DEBO' ? `Le debes a ${debt.personName}` : `${debt.personName} te debe`}
                    </p>
                    <p className='mt-2 text-xs text-slate-500'>{debt.status === 'SALDADA' ? 'Saldada' : 'Activa'}</p>
                  </div>
                  <CurrencyDisplay amount={debt.currentBalance} showDecimals={true} className='text-lg font-bold text-white' />
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <DebtPayDialog debt={debt} wallets={wallets} />
                  <Button variant='outline' size='sm' onClick={() => runAction(() => updateDebt({ id: debt.id, title: debt.title, notes: debt.notes ?? null }))}>
                    <Pencil className='h-4 w-4' />
                    Guardar
                  </Button>
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
        <section className='grid gap-4 xl:grid-cols-2'>
          <div className='glass-panel rounded-[1.75rem] p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Programado</p>
            <h2 className='mt-2 text-lg font-semibold text-white'>Nuevo pago programado</h2>
            <div className='mt-5'>
              <ScheduledPlanForm categories={categories} wallets={wallets} />
            </div>
          </div>

          <div className='glass-panel rounded-[1.75rem] p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Persona</p>
            <h2 className='mt-2 text-lg font-semibold text-white'>Nueva deuda</h2>
            <div className='mt-5'>
              <DebtForm />
            </div>
          </div>

          <div className='glass-panel rounded-[1.75rem] p-5 xl:col-span-2'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Tarjeta</p>
                <h2 className='mt-2 text-lg font-semibold text-white'>Compra a cuotas</h2>
                <p className='mt-1 text-sm text-slate-400'>Las cuotas nacen desde una compra real con tarjeta para que la deuda y el cupo queden correctos.</p>
              </div>
              <Button asChild>
                <Link href='/transacciones/nueva'>Crear desde Nuevo movimiento</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
