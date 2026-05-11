import Link from 'next/link'
import { ArrowDownCircle, ArrowUpCircle, CalendarRange, CreditCard, Sparkles, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { Category, Transaction, Wallet } from '@/interfaces'
import { RecentTransactionItem, WalletItem } from '@/components'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { isSavingsBoxInternalTransfer } from '@/lib/savings-box'

interface DashboardHomeProps {
    transactions: Transaction[] | null
    categories: Category[] | null
    wallets: Wallet[] | null
    cycleSummary?: {
        currentCycle: { label: string }
        summary: {
            totalAvailable: number
            projectedAvailable: number
            periodExpenses: number
            periodIncome: number
            totalCreditDebt: number
            obligationCount: number
            pendingScheduledTotal: number
            pendingInstallmentTotal: number
            pendingDebtTotal?: number
            pendingCreditCardTotal?: number
            totalObligations?: number
        }
    } | null
}

const StatCard = ({
    title,
    amount,
    icon: Icon,
    accent,
}: {
    title: string
    amount: number
    icon: typeof ArrowUpCircle
    accent: string
}) => (
    <Card className='rounded-[1.75rem]'>
        <CardContent className='flex items-start justify-between gap-4 p-4 sm:p-5'>
            <div className='min-w-0'>
                <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>{title}</p>
                <CurrencyDisplay amount={amount} showDecimals={true} className='mt-2 text-xl font-semibold text-white sm:text-2xl' />
            </div>
            <div className={`rounded-2xl p-3 ${accent}`}>
                <Icon className='h-5 w-5 text-white' />
            </div>
        </CardContent>
    </Card>
)

export const DashboardHome = ({ transactions, categories, wallets, cycleSummary }: DashboardHomeProps) => {
    if (!transactions || !categories || !wallets) {
        return null
    }

    const visibleTransactions = transactions.filter((transaction) => transaction.isVisible)
    const dashboardTransactions = visibleTransactions.filter((transaction) => !isSavingsBoxInternalTransfer(transaction, wallets))
    const recentTransactions = dashboardTransactions.slice(0, 4)

    const totalAvailable = cycleSummary?.summary.totalAvailable ?? wallets
        .filter((wallet) => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    const projectedAvailable = cycleSummary?.summary.projectedAvailable ?? totalAvailable
    const totalExpenses = cycleSummary?.summary.periodExpenses ?? dashboardTransactions
        .filter((transaction) => transaction.amount < 0 && transaction.type !== 'TRANSFERENCIA')
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const totalIncome = cycleSummary?.summary.periodIncome ?? dashboardTransactions
        .filter((transaction) => transaction.amount > 0 && transaction.type !== 'TRANSFERENCIA')
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    const totalCreditDebt = cycleSummary?.summary.totalCreditDebt ?? wallets
        .filter((wallet) => wallet.type === 'Tarjeta de Crédito')
        .reduce((sum, wallet) => sum + wallet.balance, 0)
    const pendingObligations = cycleSummary?.summary.totalObligations
        ?? ((cycleSummary?.summary.pendingScheduledTotal ?? 0) + (cycleSummary?.summary.pendingCreditCardTotal ?? cycleSummary?.summary.pendingInstallmentTotal ?? 0) + (cycleSummary?.summary.pendingDebtTotal ?? 0))
    const pendingCreditCardTotal = cycleSummary?.summary.pendingCreditCardTotal ?? cycleSummary?.summary.pendingInstallmentTotal ?? 0
    const cardSummaryTitle = pendingCreditCardTotal > 0 ? 'Tarjetas a pagar' : 'Deuda total tarjetas'
    const cardSummaryAmount = pendingCreditCardTotal > 0 ? pendingCreditCardTotal : totalCreditDebt
    const savingsBoxTotalsByParent = new Map(
        wallets
            .filter((wallet) => wallet.isActive && !wallet.isSavingsBox)
            .map((wallet) => [
                wallet.id,
                wallets
                    .filter((item) => item.isActive && item.isSavingsBox && item.parentWalletId === wallet.id)
                    .reduce((sum, item) => sum + item.balance, 0),
            ])
    )
    const activeWallets = wallets
        .filter((wallet) => wallet.isActive && !wallet.isSavingsBox)
        .sort((a, b) => {
            const aIsCredit = a.type === 'Tarjeta de Crédito'
            const bIsCredit = b.type === 'Tarjeta de Crédito'

            if (aIsCredit !== bIsCredit) return aIsCredit ? 1 : -1
            if (a.includeInTotal !== b.includeInTotal) return a.includeInTotal ? -1 : 1
            return Math.abs(b.balance) - Math.abs(a.balance)
        })
        .slice(0, 4)

    return (
        <div className='space-y-6'>
            <section className='grid gap-4 xl:grid-cols-[1.08fr_0.92fr]'>
                <Card className='overflow-hidden rounded-[2rem] border-white/10 bg-slate-950/58 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur-2xl'>
                    <CardContent className='relative p-5 sm:p-6'>
                        <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.10),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_42%)]' />
                        <div className='relative space-y-4'>
                            <div className='flex items-start justify-between gap-4'>
                                <div>
                                    <p className='inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-sky-100/80'>
                                        <Sparkles className='h-3.5 w-3.5' />
                                        Para gastar
                                    </p>
                                    <h2 className='mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl'>
                                        <CurrencyDisplay amount={projectedAvailable} showDecimals={true} className='text-3xl font-semibold text-white sm:text-4xl' />
                                    </h2>
                                    <p className='mt-2 text-sm text-slate-400'>
                                        {cycleSummary?.currentCycle.label ?? 'Sin ciclo calculado'}
                                    </p>
                                </div>

                                <div className='rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-3 text-slate-200'>
                                    <CalendarRange className='h-5 w-5' />
                                </div>
                            </div>

                            <div className='grid gap-3 sm:grid-cols-2'>
                                <div className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'>
                                    <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Real</p>
                                    <CurrencyDisplay amount={totalAvailable} showDecimals={true} className='mt-2 text-xl font-semibold text-white' />
                                </div>
                                <div className='rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'>
                                    <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Obligaciones</p>
                                    <CurrencyDisplay amount={pendingObligations} showDecimals={true} className='mt-2 text-xl font-semibold text-white' />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='rounded-[1.75rem]'>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <div>
                            <CardTitle className='text-lg text-white'>Cuentas</CardTitle>
                            <p className='mt-1 text-xs text-slate-500'>Principales</p>
                        </div>
                        <Link href='/billeteras' className='rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-sky-300/30 hover:text-white'>
                            Ver todas
                        </Link>
                    </CardHeader>
                    <CardContent className='grid grid-cols-2 gap-3'>
                        {activeWallets.length === 0 ? (
                            <div className='col-span-2 rounded-[1.35rem] border border-dashed border-white/10 p-4 text-sm text-slate-400'>
                                Aún no hay cuentas activas.
                            </div>
                        ) : activeWallets.map((wallet) => (
                            <WalletItem
                                key={wallet.id}
                                wallet={wallet}
                                displayBalance={wallet.balance + (savingsBoxTotalsByParent.get(wallet.id) ?? 0)}
                            />
                        ))}
                    </CardContent>
                </Card>
            </section>

            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <StatCard title='Obligaciones' amount={pendingObligations} icon={Target} accent='bg-sky-500/20' />
                <StatCard title={cardSummaryTitle} amount={cardSummaryAmount} icon={CreditCard} accent='bg-violet-500/20' />
                <StatCard title='Ingresos' amount={totalIncome} icon={ArrowUpCircle} accent='bg-emerald-500/20' />
                <StatCard title='Gastos' amount={totalExpenses} icon={ArrowDownCircle} accent='bg-rose-500/20' />
            </div>

            <Card className='rounded-[1.75rem]'>
                <CardHeader className='pb-2'>
                    <CardTitle className='text-lg text-white'>Movimientos recientes</CardTitle>
                </CardHeader>
                <CardContent className='space-y-5'>
                    {recentTransactions.length === 0 ? (
                        <p className='text-sm text-slate-400'>Sin movimientos recientes.</p>
                    ) : recentTransactions.map((transaction) => (
                        <RecentTransactionItem key={transaction.id} transaction={transaction} categories={categories} />
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
