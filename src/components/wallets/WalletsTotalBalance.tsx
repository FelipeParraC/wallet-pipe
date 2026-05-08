import type { Wallet } from '@/interfaces'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'

interface TotalBalanceProps {
    wallets: Wallet[]
    cycleSummary?: {
        summary: {
            totalAvailable: number
            projectedAvailable: number
            totalObligations?: number
            totalCreditDebt?: number
        }
    } | null
}


export const WalletsTotalBalance = ({ wallets, cycleSummary }: TotalBalanceProps) => {

    const totalBalance = cycleSummary?.summary.totalAvailable ?? wallets
        .filter(wallet => wallet.includeInTotal && wallet.type !== 'Tarjeta de Crédito')
        .reduce((sum, wallet) => sum + wallet.balance, 0)
    const obligations = cycleSummary?.summary.totalObligations ?? 0
    const projectedAvailable = cycleSummary?.summary.projectedAvailable ?? totalBalance
    const creditDebt = cycleSummary?.summary.totalCreditDebt ?? wallets
        .filter(wallet => wallet.type === 'Tarjeta de Crédito')
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    return (
        <Card className='rounded-[2rem] overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(7,16,30,0.82),rgba(9,19,36,0.66))] text-white shadow-[0_24px_70px_rgba(2,6,23,0.34)]'>
            <CardHeader>
                <CardTitle className='text-white text-2xl md:text-3xl'>Balance total</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
                <CurrencyDisplay amount={totalBalance} showDecimals={true} className='text-4xl font-bold text-white md:text-5xl' />
                <div className='grid gap-3 md:grid-cols-3'>
                    <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                        <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Obligaciones ciclo</p>
                        <CurrencyDisplay amount={obligations} showDecimals={true} className='mt-1 text-lg font-semibold text-amber-300' />
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                        <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Después de pagar</p>
                        <CurrencyDisplay amount={projectedAvailable} showDecimals={true} className='mt-1 text-lg font-semibold text-sky-200' />
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                        <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Deuda tarjetas</p>
                        <CurrencyDisplay amount={creditDebt} showDecimals={true} className='mt-1 text-lg font-semibold text-violet-200' />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
