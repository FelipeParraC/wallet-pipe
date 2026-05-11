'use client'

import Link from 'next/link'
import { ChevronRight, PiggyBank } from 'lucide-react'
import type { Wallet } from '@/interfaces'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

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
    const totalSavingsBoxes = savingsBoxes.reduce((sum, item) => sum + item.balance, 0)

    return (
        <section>
            <Link
                href={`/billeteras/${wallet.id}/cajitas`}
                className='group block overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-white/[0.07] sm:p-5'
            >
                <div className='flex items-center justify-between gap-4'>
                    <div className='flex min-w-0 items-center gap-3'>
                        <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-100'>
                            <PiggyBank className='h-5 w-5' />
                        </span>
                        <div className='min-w-0'>
                            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Cuenta</p>
                            <h2 className='mt-1 text-xl font-semibold text-white'>Cajitas</h2>
                            <p className='mt-1 text-sm text-slate-400'>
                                {savingsBoxes.length === 1 ? '1 cajita' : `${savingsBoxes.length} cajitas`}
                            </p>
                        </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-3'>
                        <CurrencyDisplay amount={totalSavingsBoxes} showDecimals={true} className='text-right text-xl font-semibold text-white' />
                        <ChevronRight className='h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-200' />
                    </div>
                </div>
            </Link>
        </section>
    )
}
