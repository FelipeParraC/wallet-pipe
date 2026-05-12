'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, CreditCard, Landmark } from 'lucide-react'
import type { Category, Wallet } from '@/interfaces'
import { DebtForm, ScheduledPlanForm } from '@/components'
import { Button } from '@/components/ui'

type CreateKind = 'scheduled' | 'debt' | 'installment'

interface PlanningCreateFlowProps {
  categories: Category[]
  wallets: Wallet[]
}

const options: Array<{
  id: CreateKind
  title: string
  description: string
  icon: React.ReactNode
  tone: string
}> = [
  {
    id: 'scheduled',
    title: 'Pago programado',
    description: 'Servicios, suscripciones o pagos que se repiten.',
    icon: <CalendarPlus className='h-5 w-5' />,
    tone: 'border-sky-200/20 bg-sky-400/12 text-sky-100',
  },
  {
    id: 'debt',
    title: 'Deuda',
    description: 'Dinero que debes o que alguien te debe.',
    icon: <Landmark className='h-5 w-5' />,
    tone: 'border-amber-200/20 bg-amber-400/12 text-amber-100',
  },
  {
    id: 'installment',
    title: 'Compra a cuotas',
    description: 'Compra real con tarjeta para crear cuotas futuras.',
    icon: <CreditCard className='h-5 w-5' />,
    tone: 'border-violet-200/20 bg-violet-400/12 text-violet-100',
  },
]

export const PlanningCreateFlow = ({ categories, wallets }: PlanningCreateFlowProps) => {
  const [selectedKind, setSelectedKind] = useState<CreateKind | null>(null)

  if (!selectedKind) {
    return (
      <section className='grid gap-3 lg:grid-cols-3'>
        {options.map((option) => (
          <button
            key={option.id}
            type='button'
            onClick={() => setSelectedKind(option.id)}
            className='rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-sky-200/25 hover:bg-white/[0.07]'
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${option.tone}`}>
              {option.icon}
            </span>
            <span className='mt-4 block font-semibold text-white'>{option.title}</span>
            <span className='mt-1 block text-sm text-slate-400'>{option.description}</span>
          </button>
        ))}
      </section>
    )
  }

  return (
    <section className='glass-panel rounded-[1.75rem] p-5'>
      <Button variant='ghost' className='mb-4 px-0 text-sky-300 hover:bg-transparent hover:text-sky-200' onClick={() => setSelectedKind(null)}>
        <ArrowLeft className='h-4 w-4' />
        Volver a elegir tipo
      </Button>

      {selectedKind === 'scheduled' && (
        <>
          <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Programado</p>
          <h2 className='mt-2 text-lg font-semibold text-white'>Nuevo pago programado</h2>
          <div className='mt-5'>
            <ScheduledPlanForm categories={categories} wallets={wallets} />
          </div>
        </>
      )}

      {selectedKind === 'debt' && (
        <>
          <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Persona</p>
          <h2 className='mt-2 text-lg font-semibold text-white'>Nueva deuda</h2>
          <div className='mt-5'>
            <DebtForm />
          </div>
        </>
      )}

      {selectedKind === 'installment' && (
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Tarjeta</p>
            <h2 className='mt-2 text-lg font-semibold text-white'>Compra a cuotas</h2>
            <p className='mt-1 text-sm text-slate-400'>Las cuotas nacen desde una compra real con tarjeta para mantener deuda y cupo correctos.</p>
          </div>
          <Button asChild>
            <Link href='/movimientos/nueva'>Crear desde Nuevo movimiento</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
