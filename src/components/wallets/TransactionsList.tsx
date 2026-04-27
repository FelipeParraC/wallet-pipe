'use client'

import type { Category, Transaction, Wallet } from '@/interfaces'
import { TransactionsGrid } from '../transactions/TransactionsGrid'

interface TransactionsListProps {
    transactions: Transaction[] | null
    categories: Category[] | null
    walletId: string
    wallets: Wallet[] | null
}

export const TransactionsList = ({ transactions, categories, walletId, wallets }: TransactionsListProps) => {
    return (
        <section className='space-y-4'>
            <div className='glass-panel rounded-[1.75rem] p-5'>
                <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Cuenta</p>
                <h2 className='mt-2 text-xl font-semibold text-white'>Movimientos</h2>
            </div>
            <TransactionsGrid
                transactions={transactions}
                categories={categories}
                wallets={wallets}
                contextWalletId={walletId}
            />
        </section>
    )
}
