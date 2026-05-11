export const revalidate = 0

import Link from 'next/link'
import { ArrowLeft, ChevronRight, PiggyBank, Plus } from 'lucide-react'
import { getWalletById, getWallets } from '@/actions'
import { BackButton, CurrencyDisplay, SavingsBoxForm } from '@/components'
import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function CajitasPage({ params }: Props) {
  const respWallet = await getWalletById(params.id)

  if (!respWallet.ok || !respWallet.wallet) {
    redirect('/billeteras')
  }

  const parentWallet = respWallet.wallet

  if (!parentWallet.isActive || parentWallet.isSavingsBox || parentWallet.type === 'Tarjeta de Crédito' || parentWallet.type === 'Transporte') {
    redirect(`/billeteras/${parentWallet.id}`)
  }

  const respWallets = await getWallets()
  const wallets = respWallets.ok ? respWallets.wallets ?? [] : []
  const savingsBoxes = wallets.filter((wallet) => wallet.isActive && wallet.isSavingsBox && wallet.parentWalletId === parentWallet.id)
  const totalSavingsBoxes = savingsBoxes.reduce((sum, wallet) => sum + wallet.balance, 0)

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <BackButton href={`/billeteras/${parentWallet.id}`} texto={parentWallet.name} />
        <SavingsBoxForm
          wallets={wallets}
          defaultParentWalletId={parentWallet.id}
          hideParentSelector
          trigger={(
            <span className='inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)]'>
              <Plus className='h-4 w-4' />
              Crear
            </span>
          )}
        />
      </div>

      <section className='overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Cajitas</p>
            <h1 className='mt-2 text-2xl font-semibold text-white'>{parentWallet.name}</h1>
            <p className='mt-2 text-sm text-slate-400'>
              {savingsBoxes.length === 1 ? '1 cajita' : `${savingsBoxes.length} cajitas`}
            </p>
          </div>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-100'>
            <PiggyBank className='h-5 w-5' />
          </span>
        </div>
        <CurrencyDisplay amount={totalSavingsBoxes} showDecimals={true} className='mt-5 text-4xl font-bold text-white' />
      </section>

      {savingsBoxes.length === 0 ? (
        <div className='rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.035] p-5 text-sm text-slate-400'>
          Aún no tienes cajitas en esta cuenta.
        </div>
      ) : (
        <section className='grid gap-3 sm:grid-cols-2'>
          {savingsBoxes.map((box) => (
            <Link
              key={box.id}
              href={`/billeteras/${box.id}`}
              className='group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-white/[0.07]'
            >
              <div className='pointer-events-none absolute inset-x-4 top-0 h-12 rounded-b-[1.2rem] opacity-50 blur-2xl' style={{ backgroundColor: box.color }} />
              <div className='relative flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-base font-semibold text-white'>{box.name}</p>
                  <p className='mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500'>
                    {box.includeInTotal ? 'Suma al disponible' : 'Apartada'}
                  </p>
                </div>
                <ChevronRight className='h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-200' />
              </div>
              <CurrencyDisplay amount={box.balance} showDecimals={true} className='relative mt-4 text-2xl font-semibold text-white' />
            </Link>
          ))}
        </section>
      )}

      <Link href={`/billeteras/${parentWallet.id}`} className='inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white'>
        <ArrowLeft className='h-4 w-4' />
        Volver a la cuenta
      </Link>
    </div>
  )
}
