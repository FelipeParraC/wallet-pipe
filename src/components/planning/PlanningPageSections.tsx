import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { PageHeader, SummaryPanel } from '@/components/layout/PagePrimitives'

export const PlanningCycleHeader = ({
  label,
  previousHref,
  todayHref,
  nextHref,
}: {
  label: string
  previousHref: string
  todayHref: string
  nextHref: string
}) => (
  <PageHeader
    eyebrow='Planeación'
    title='Centro del ciclo'
    description={label}
    actions={(
      <div className='grid grid-cols-3 gap-2 sm:flex sm:flex-wrap'>
        <Button variant='outline' size='sm' asChild>
          <Link href={previousHref}>Anterior</Link>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link href={todayHref}>Hoy</Link>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link href={nextHref}>Siguiente</Link>
        </Button>
      </div>
    )}
  />
)

export const PlanningDecisionSummary = ({
  totalObligations,
  projectedAvailable,
}: {
  totalObligations: number
  projectedAvailable: number
}) => (
  <SummaryPanel eyebrow='Para decidir'>
    <div className='grid gap-4 sm:grid-cols-2'>
      <div>
        <p className='text-sm text-slate-400'>Por pagar</p>
        <CurrencyDisplay amount={totalObligations} showDecimals={true} className='mt-1 text-3xl font-bold text-white' />
      </div>
      <div>
        <p className='text-sm text-slate-400'>Después de pagar</p>
        <CurrencyDisplay amount={projectedAvailable} showDecimals={true} className='mt-1 text-3xl font-bold text-emerald-200' />
      </div>
    </div>
  </SummaryPanel>
)

export const PlanningNavGrid = ({
  cards,
}: {
  cards: Array<{
    key: string
    href: string
    title: string
    description: string
    value: string
    icon: ReactNode
    tone: string
  }>
}) => (
  <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
    {cards.map((card) => (
      <Link
        key={card.key}
        href={card.href}
        className='group min-h-[10.5rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-sky-200/25 hover:bg-white/[0.07]'
      >
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${card.tone}`}>
          {card.icon}
        </span>
        <p className='mt-4 font-semibold text-white'>{card.title}</p>
        <p className='mt-1 min-h-10 text-sm leading-5 text-slate-400'>{card.description}</p>
        <p className='mt-3 text-sm font-semibold text-sky-100'>{card.value}</p>
      </Link>
    ))}
  </section>
)

export const PlanningMetricGrid = ({
  metrics,
}: {
  metrics: Array<{ label: string; amount: number; className: string }>
}) => (
  <section className='grid gap-3 sm:grid-cols-3'>
    {metrics.map((metric) => (
      <div key={metric.label} className='glass-panel rounded-[1.4rem] p-4'>
        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>{metric.label}</p>
        <CurrencyDisplay amount={metric.amount} showDecimals={true} className={`mt-2 text-lg font-bold ${metric.className}`} />
      </div>
    ))}
  </section>
)

export const PlanningSectionHeader = ({
  backHref,
  title,
  description,
}: {
  backHref: string
  title: string
  description: string
}) => (
  <section className='glass-panel rounded-[1.75rem] p-5'>
    <Link href={backHref} className='mb-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200'>
      <ArrowLeft className='h-4 w-4' />
      Volver a Planeación
    </Link>
    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Planeación</p>
    <h2 className='mt-2 text-xl font-semibold text-white'>{title}</h2>
    <p className='mt-1 text-sm text-slate-400'>{description}</p>
  </section>
)
