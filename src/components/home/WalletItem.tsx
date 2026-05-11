'use client'

import Link from 'next/link'
import { CurrencyDisplay } from '../CurrencyDisplay'
import type { Wallet } from '@/interfaces'
import { CreditCard, PiggyBank, WalletCards } from 'lucide-react'

interface WalletItemProps {
    wallet: Wallet
    displayBalance?: number
}

export const WalletItem = ({ wallet, displayBalance }: WalletItemProps) => {
    const isCreditCard = wallet.type === 'Tarjeta de Crédito'
    const Icon = isCreditCard ? CreditCard : wallet.isSavingsBox ? PiggyBank : WalletCards
    const balanceLabel = isCreditCard ? 'Deuda' : wallet.isSavingsBox ? 'Cajita' : 'Saldo'
    const balance = displayBalance ?? wallet.balance

    return (
        <Link
            href={`/billeteras/${ wallet.id }`}
            className='group relative block overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-sky-300/30 hover:bg-white/[0.07]'
        >
            <div
                className='pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90'
                style={{ backgroundColor: wallet.color }}
            />
            <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold text-white'>{ wallet.name }</p>
                    <p className='mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500'>{ balanceLabel }</p>
                </div>
                <span
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45 text-white transition-transform duration-200 group-hover:scale-105'
                    style={{ boxShadow: `0 12px 28px ${wallet.color}33` }}
                >
                    <Icon className='h-4 w-4' style={{ color: wallet.color }} />
                </span>
            </div>
            <CurrencyDisplay
                amount={ balance }
                showDecimals={ true }
                className='mt-3 truncate text-lg font-semibold text-white'
            />
            <p className='mt-1 truncate text-xs text-slate-400'>
                { wallet.includeInTotal && !isCreditCard ? 'Suma al disponible' : isCreditCard ? 'No suma al disponible' : 'Apartada' }
            </p>
        </Link>
    )
}
