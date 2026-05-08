'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Transaction, Wallet } from "@/interfaces"
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { getAmountColor, getTransactionTypeLabel } from '@/utils'

interface TransactionCardProps {
    transaction: Transaction
    categories: Category[]
    wallets: Wallet[]
    contextWalletId?: string
    onClick: () => void
}

export const TransactionCard = ({ transaction, categories, wallets, onClick }: TransactionCardProps) => {
    const walletName = wallets.find((wallet) => wallet.id === transaction.walletId)?.name
    const fromWalletName = wallets.find((wallet) => wallet.id === transaction.fromWalletId)?.name
    const toWalletName = wallets.find((wallet) => wallet.id === transaction.toWalletId)?.name
    const accountLabel = transaction.fromWalletId && transaction.toWalletId
        ? `${fromWalletName ?? 'Origen'} → ${toWalletName ?? 'Destino'}`
        : walletName

    return (
        <Card
            className="cursor-pointer rounded-[1.75rem] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,6,23,0.24)]"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    <span className="truncate text-white">{transaction.title}</span>
                    <CurrencyDisplay
                        amount={Math.abs(transaction.amount)}
                        showDecimals={true}
                        className={`text-lg font-bold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-400' : getAmountColor(transaction.amount)}`}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="card-content space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        {getTransactionTypeLabel(transaction.type)}
                        {transaction.categoryId ? ` · ${categories.find( c => c.id === transaction.categoryId )?.name ?? 'Sin categoría'}` : ''}
                    </p>
                    {accountLabel && (
                        <p className="text-sm text-slate-400">{accountLabel}</p>
                    )}
                    {transaction.description && (
                        <p className="text-sm text-slate-300">{ transaction.description }</p>
                    )}
                    {(transaction.tags?.length ?? 0) > 0 && (
                        <div className='flex flex-wrap gap-1.5'>
                            {transaction.tags?.slice(0, 3).map((tag) => (
                                <span
                                    key={tag.id}
                                    className='rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white'
                                    style={{ backgroundColor: tag.color || '#334155' }}
                                >
                                    #{tag.name}
                                </span>
                            ))}
                            {(transaction.tags?.length ?? 0) > 3 && (
                                <span className='rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-300'>
                                    +{(transaction.tags?.length ?? 0) - 3}
                                </span>
                            )}
                        </div>
                    )}
                    <p className="text-sm text-slate-500">
                        {format(parseISO(transaction.occurredAt || transaction.date), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

