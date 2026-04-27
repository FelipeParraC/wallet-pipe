export const revalidate = 0

import { getCategories, getCurrentCycleSummary } from '@/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { CurrencyDisplay } from '@/components'
import type { Category, Transaction, Wallet } from '@/interfaces'

export default async function ReportesPage() {
    const [respSummary, respCategories] = await Promise.all([
        getCurrentCycleSummary(),
        getCategories(),
    ])

    const cycleSummary = respSummary.ok ? respSummary.data : null
    const transactions = cycleSummary?.transactions ?? []
    const wallets = cycleSummary?.wallets ?? []
    const categories = respCategories.ok ? respCategories.categories ?? [] : []

    const visibleTransactions = transactions.filter((transaction: Transaction) => transaction.isVisible)
    const expenses = visibleTransactions.filter((transaction: Transaction) => transaction.amount < 0 && transaction.type !== 'TRANSFERENCIA')
    const expensesByCategory = categories
        .map((category: Category) => ({
            ...category,
            total: expenses
                .filter((transaction: Transaction) => transaction.categoryId === category.id)
                .reduce((sum: number, transaction: Transaction) => sum + Math.abs(transaction.amount), 0)
        }))
        .filter((category: Category & { total: number }) => category.total > 0)
        .sort((a: Category & { total: number }, b: Category & { total: number }) => b.total - a.total)

    const topWallets = wallets
        .filter((wallet: Wallet) => wallet.includeInTotal)
        .sort((a: Wallet, b: Wallet) => b.balance - a.balance)
        .slice(0, 4)

    const totalTracked = wallets
        .filter((wallet: Wallet) => wallet.includeInTotal)
        .reduce((sum: number, wallet: Wallet) => sum + wallet.balance, 0)

    return (
        <div className='space-y-6'>
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Lectura</p>
                <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Reportes</h1>
                {cycleSummary && (
                    <p className='mt-1 text-sm text-slate-400'>
                        {cycleSummary.currentCycle.label}
                    </p>
                )}
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Saldo rastreado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay amount={ totalTracked } showDecimals={ true } className='text-3xl font-bold text-green-500' />
                    </CardContent>
                </Card>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Gasto del ciclo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay amount={ expenses.reduce((sum: number, transaction: Transaction) => sum + Math.abs(transaction.amount), 0) } showDecimals={ true } className='text-3xl font-bold text-red-500' />
                    </CardContent>
                </Card>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Disponible proyectado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay amount={ cycleSummary?.summary.projectedAvailable ?? 0 } showDecimals={ true } className='text-3xl font-bold text-amber-400' />
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Gasto por categoría</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {expensesByCategory.length === 0 && (
                            <p className='text-sm text-slate-400'>Sin gastos visibles.</p>
                        )}
                        {expensesByCategory.map((category: Category & { total: number }) => (
                            <div key={category.id} className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <div className='flex items-center gap-3'>
                                    <span className='h-3 w-3 rounded-full' style={{ backgroundColor: category.color }} />
                                    <span className='text-white'>{category.name}</span>
                                </div>
                                <CurrencyDisplay amount={ category.total } showDecimals={ true } className='font-semibold text-red-400' />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Resumen del ciclo</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Ingresos</p>
                            <CurrencyDisplay amount={ cycleSummary?.summary.periodIncome ?? 0 } showDecimals={ true } className='font-semibold text-green-400' />
                        </div>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Obligaciones</p>
                            <CurrencyDisplay amount={ (cycleSummary?.summary.pendingScheduledTotal ?? 0) + (cycleSummary?.summary.pendingInstallmentTotal ?? 0) } showDecimals={ true } className='font-semibold text-amber-400' />
                        </div>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Deuda tarjetas</p>
                            <CurrencyDisplay amount={ cycleSummary?.summary.totalCreditDebt ?? 0 } showDecimals={ true } className='font-semibold text-violet-400' />
                        </div>
                        {topWallets.map((wallet: Wallet) => (
                            <div key={wallet.id} className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <div className='flex items-center gap-3'>
                                    <span className='h-3 w-3 rounded-full' style={{ backgroundColor: wallet.color }} />
                                    <div>
                                        <p className='font-medium text-white'>{wallet.name}</p>
                                        <p className='text-sm text-slate-500'>{wallet.type}</p>
                                    </div>
                                </div>
                                <CurrencyDisplay amount={ wallet.balance } showDecimals={ true } className='font-semibold' />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
