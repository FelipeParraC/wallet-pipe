export const revalidate = 0

import { getCurrentCycleSummary, getPlanningCycleOverview } from '@/actions'
import { CurrencyDisplay } from '@/components'
import { CycleEvolutionChart } from '@/components/reports/CycleEvolutionChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { Category, Transaction, Wallet } from '@/interfaces'

const percent = (value: number, total: number) => {
    if (total <= 0) return 0
    return Math.min(100, Math.round((value / total) * 100))
}

export default async function ReportesPage() {
    const planningResponse = await getPlanningCycleOverview()
    const summaryResponse = await getCurrentCycleSummary()

    const planning = planningResponse.ok ? planningResponse.data : null
    const cycleSummary = summaryResponse.ok ? summaryResponse.data : null
    const transactions = cycleSummary?.transactions ?? []
    const wallets = cycleSummary?.wallets ?? []
    const categories = planning?.categories ?? []

    const visibleTransactions = transactions.filter((transaction: Transaction) => transaction.isVisible)
    const expenses = visibleTransactions.filter((transaction: Transaction) => transaction.amount < 0 && transaction.type !== 'TRANSFERENCIA')
    const totalExpenses = expenses.reduce((sum: number, transaction: Transaction) => sum + Math.abs(transaction.amount), 0)
    const totalIncome = cycleSummary?.summary.periodIncome ?? 0
    const pendingScheduledTotal = planning?.summary.pendingScheduledTotal ?? cycleSummary?.summary.pendingScheduledTotal ?? 0
    const pendingInstallmentTotal = planning?.summary.pendingInstallmentTotal ?? cycleSummary?.summary.pendingInstallmentTotal ?? 0
    const pendingDebtTotal = planning?.summary.pendingDebtTotal ?? 0
    const pendingCreditCardTotal = planning?.summary.pendingCreditCardTotal ?? cycleSummary?.summary.pendingCreditCardTotal ?? pendingInstallmentTotal
    const creditDebt = cycleSummary?.summary.totalCreditDebt ?? 0
    const totalPending = pendingScheduledTotal + pendingCreditCardTotal + pendingDebtTotal
    const totalObligations = totalPending + (planning?.summary.paidInCycle ?? 0)
    const paidProgress = percent(planning?.summary.paidInCycle ?? 0, totalObligations)

    const expensesByCategory = categories
        .map((category: Category) => ({
            ...category,
            total: expenses
                .filter((transaction: Transaction) => transaction.categoryId === category.id)
                .reduce((sum: number, transaction: Transaction) => sum + Math.abs(transaction.amount), 0)
        }))
        .filter((category: Category & { total: number }) => category.total > 0)
        .sort((a: Category & { total: number }, b: Category & { total: number }) => b.total - a.total)

    const trackedWallets = wallets
        .filter((wallet: Wallet) => wallet.includeInTotal && wallet.type !== 'Tarjeta de Crédito')
        .sort((a: Wallet, b: Wallet) => b.balance - a.balance)

    return (
        <div className='space-y-6'>
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Reportes</p>
                <div className='mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                    <div>
                        <h1 className='text-2xl font-semibold text-white md:text-3xl'>Lectura del ciclo</h1>
                        <p className='mt-1 text-sm text-slate-400'>{cycleSummary?.currentCycle.label ?? planning?.currentCycle.label ?? 'Ciclo actual'}</p>
                    </div>
                    <div className='rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100'>
                        {planning?.summary.pendingCount ?? 0} pendientes
                    </div>
                </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                <Card>
                    <CardContent className='p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Disponible real</p>
                        <CurrencyDisplay amount={cycleSummary?.summary.totalAvailable ?? 0} showDecimals={true} className='mt-2 text-2xl font-bold text-white' />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className='p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Disponible proyectado</p>
                        <CurrencyDisplay amount={(cycleSummary?.summary.totalAvailable ?? 0) - totalPending} showDecimals={true} className='mt-2 text-2xl font-bold text-sky-200' />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className='p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Ingresos</p>
                        <CurrencyDisplay amount={totalIncome} showDecimals={true} className='mt-2 text-2xl font-bold text-emerald-300' />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className='p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Gastos</p>
                        <CurrencyDisplay amount={totalExpenses} showDecimals={true} className='mt-2 text-2xl font-bold text-rose-300' />
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
                <Card>
                    <CardHeader>
                        <CardTitle>Evolución del ciclo</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[340px]'>
                        <CycleEvolutionChart transactions={visibleTransactions} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pagado vs pendiente</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div>
                            <div className='mb-2 flex items-center justify-between text-sm'>
                                <span className='text-slate-400'>Avance</span>
                                <span className='font-semibold text-white'>{paidProgress}%</span>
                            </div>
                            <div className='h-3 overflow-hidden rounded-full bg-white/[0.06]'>
                                <div className='h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-400' style={{ width: `${paidProgress}%` }} />
                            </div>
                        </div>
                        <div className='grid gap-3'>
                            <div className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <span className='text-sm text-slate-300'>Pagado del ciclo</span>
                                <CurrencyDisplay amount={planning?.summary.paidInCycle ?? 0} showDecimals={true} className='font-semibold text-emerald-300' />
                            </div>
                            <div className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <span className='text-sm text-slate-300'>Pendiente total</span>
                                <CurrencyDisplay amount={totalPending} showDecimals={true} className='font-semibold text-amber-300' />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-3'>
                <Card>
                    <CardHeader>
                        <CardTitle>Obligaciones</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {[
                            { label: 'Programados', value: pendingScheduledTotal, tone: 'text-sky-300' },
                            { label: 'Tarjetas a pagar', value: pendingCreditCardTotal, tone: 'text-violet-300' },
                            { label: 'Deudas', value: pendingDebtTotal, tone: 'text-rose-300' },
                            { label: 'Deuda total tarjetas', value: creditDebt, tone: 'text-slate-300' },
                        ].map((item) => (
                            <div key={item.label} className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <span className='text-sm text-slate-300'>{item.label}</span>
                                <CurrencyDisplay amount={item.value} showDecimals={true} className={`font-semibold ${item.tone}`} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gasto por categoría</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {expensesByCategory.length === 0 && <p className='text-sm text-slate-400'>Sin gastos visibles.</p>}
                        {expensesByCategory.slice(0, 6).map((category: Category & { total: number }) => (
                            <div key={category.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='flex items-center gap-3'>
                                        <span className='h-3 w-3 rounded-full' style={{ backgroundColor: category.color }} />
                                        <span className='text-sm text-white'>{category.name}</span>
                                    </div>
                                    <CurrencyDisplay amount={category.total} showDecimals={true} className='font-semibold text-rose-300' />
                                </div>
                                <div className='mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]'>
                                    <div className='h-full rounded-full bg-rose-300' style={{ width: `${percent(category.total, totalExpenses)}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cuentas</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {trackedWallets.length === 0 && <p className='text-sm text-slate-400'>Sin cuentas rastreadas.</p>}
                        {trackedWallets.slice(0, 6).map((wallet: Wallet) => (
                            <div key={wallet.id} className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                <div className='flex items-center gap-3'>
                                    <span className='h-3 w-3 rounded-full' style={{ backgroundColor: wallet.color }} />
                                    <div>
                                        <p className='text-sm font-medium text-white'>{wallet.name}</p>
                                        <p className='text-xs text-slate-500'>{wallet.type}</p>
                                    </div>
                                </div>
                                <CurrencyDisplay amount={wallet.balance} showDecimals={true} className='font-semibold text-white' />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
