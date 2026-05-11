'use client'

import Link from 'next/link'
import { PiggyBank, Plus } from 'lucide-react'
import type { Wallet } from '@/interfaces'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { SavingsBoxForm } from './SavingsBoxForm'

interface WalletSavingsBoxesSectionProps {
    wallet: Wallet
    wallets: Wallet[]
}

export const WalletSavingsBoxesSection = ({ wallet, wallets }: WalletSavingsBoxesSectionProps) => {
    const canHaveSavingsBoxes = wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte'

    if (!canHaveSavingsBoxes) {
        return null
    }

    const savingsBoxes = wallets.filter((item) => item.isActive && item.isSavingsBox && item.parentWalletId === wallet.id)

    return (
        <section className='space-y-3'>
            <div className='glass-panel rounded-[1.75rem] p-4 sm:p-5'>
                <div className='flex items-center justify-between gap-3'>
                    <div>
                        <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Cuenta</p>
                        <h2 className='mt-1 text-xl font-semibold text-white'>Cajitas</h2>
                    </div>
                    <SavingsBoxForm
                        wallets={wallets}
                        defaultParentWalletId={wallet.id}
                        hideParentSelector
                        trigger={(
                            <span className='inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)]'>
                                <Plus className='h-4 w-4' />
                                Crear
                            </span>
                        )}
                    />
                </div>
            </div>

            {savingsBoxes.length === 0 ? (
                <div className='rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.035] p-5 text-sm text-slate-400'>
                    Aún no tienes cajitas en esta cuenta.
                </div>
            ) : (
                <div className='grid gap-3 sm:grid-cols-2'>
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
                                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sky-100'>
                                    <PiggyBank className='h-4 w-4' />
                                </span>
                            </div>
                            <CurrencyDisplay amount={box.balance} showDecimals={true} className='relative mt-4 text-2xl font-semibold text-white' />
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}
