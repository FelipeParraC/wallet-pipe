export const revalidate = 0

import { getCurrentCycleSummary, getSettingsOverview } from '@/actions'
import { DebtForm, InstallmentPlanForm, ScheduledPlanForm } from '@/components'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/utils'

export default async function PlaneacionPage() {
    const [settingsOverviewResponse, cycleSummaryResponse] = await Promise.all([
        getSettingsOverview(),
        getCurrentCycleSummary(),
    ])

    const settingsOverview = settingsOverviewResponse.ok && settingsOverviewResponse.data ? settingsOverviewResponse.data : null
    const cycleSummary = cycleSummaryResponse.ok && cycleSummaryResponse.data ? cycleSummaryResponse.data : null

    const categories = settingsOverview?.categories ?? []
    const wallets = settingsOverview?.wallets ?? []
    const scheduledPlans = settingsOverview?.scheduledPlans ?? []
    const installmentPlans = settingsOverview?.installmentPlans ?? []
    const debts = settingsOverview?.debts ?? []

    const pendingScheduled = cycleSummary?.summary.pendingScheduledTotal ?? 0
    const pendingInstallments = cycleSummary?.summary.pendingInstallmentTotal ?? 0
    const creditDebt = cycleSummary?.summary.totalCreditDebt ?? 0

    return (
        <div className='space-y-6'>
            <section className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Planeación</p>
                <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Compromisos y proyección</h1>
                <p className='mt-2 text-sm text-slate-400'>{cycleSummary?.currentCycle.label ?? 'Sin ciclo calculado'}</p>
            </section>

            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <Card className='rounded-[1.75rem]'>
                    <CardContent className='p-4 sm:p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Programados</p>
                        <CurrencyDisplay amount={pendingScheduled} showDecimals={true} className='mt-2 text-xl font-semibold text-white' />
                    </CardContent>
                </Card>
                <Card className='rounded-[1.75rem]'>
                    <CardContent className='p-4 sm:p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Cuotas</p>
                        <CurrencyDisplay amount={pendingInstallments} showDecimals={true} className='mt-2 text-xl font-semibold text-white' />
                    </CardContent>
                </Card>
                <Card className='rounded-[1.75rem]'>
                    <CardContent className='p-4 sm:p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Deuda tarjetas</p>
                        <CurrencyDisplay amount={creditDebt} showDecimals={true} className='mt-2 text-xl font-semibold text-white' />
                    </CardContent>
                </Card>
                <Card className='rounded-[1.75rem]'>
                    <CardContent className='p-4 sm:p-5'>
                        <p className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Elementos activos</p>
                        <p className='mt-2 text-xl font-semibold text-white'>{scheduledPlans.length + installmentPlans.length + debts.length}</p>
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 xl:grid-cols-3'>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Pagos programados</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        <ScheduledPlanForm categories={categories} wallets={wallets} />
                        <div className='grid gap-3'>
                            {scheduledPlans.length === 0 ? (
                                <p className='text-sm text-slate-400'>Sin pagos programados.</p>
                            ) : scheduledPlans.map((plan) => (
                                <div key={plan.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                    <p className='font-medium text-white'>{plan.title}</p>
                                    <p className='mt-1 text-xs text-slate-500'>
                                        {plan.kind} · {plan.amountMode} · {plan.frequency}
                                    </p>
                                    <p className='mt-2 text-sm text-slate-300'>
                                        {plan.fixedAmount !== null ? formatCurrency(plan.fixedAmount) : 'Monto variable'}
                                        {plan.dueDay ? ` · Día ${plan.dueDay}` : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Cuotas</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        <InstallmentPlanForm categories={categories} wallets={wallets} />
                        <div className='grid gap-3'>
                            {installmentPlans.length === 0 ? (
                                <p className='text-sm text-slate-400'>Sin compras a cuotas.</p>
                            ) : installmentPlans.map((plan) => (
                                <div key={plan.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                    <p className='font-medium text-white'>{plan.title}</p>
                                    <p className='mt-1 text-xs text-slate-500'>
                                        {plan.remainingInstallments} de {plan.totalInstallments} pendientes
                                    </p>
                                    <p className='mt-2 text-sm text-slate-300'>
                                        {formatCurrency(plan.installmentAmount)} · {formatCurrency(plan.totalAmount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Deudas</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        <DebtForm />
                        <div className='grid gap-3'>
                            {debts.length === 0 ? (
                                <p className='text-sm text-slate-400'>Sin deudas registradas.</p>
                            ) : debts.map((debt) => (
                                <div key={debt.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                                    <p className='font-medium text-white'>{debt.title}</p>
                                    <p className='mt-1 text-xs text-slate-500'>
                                        {debt.direction === 'YO_DEBO' ? `Le debes a ${debt.personName}` : `${debt.personName} te debe`}
                                    </p>
                                    <p className='mt-2 text-sm text-slate-300'>
                                        {formatCurrency(debt.currentBalance)} · {formatCurrency(debt.principalAmount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
