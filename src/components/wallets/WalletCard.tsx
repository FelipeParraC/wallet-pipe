import Link from 'next/link'
import type { Wallet } from '@/interfaces'
import { getIcon } from '@/utils'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'

interface WalletCardProps {
    wallet: Wallet
}


export const WalletCard = ({ wallet }: WalletCardProps) => {

    const Icon = getIcon( wallet.type )
    const isCreditCard = wallet.type === 'Tarjeta de Crédito'

    return (
        <Link href={`/billeteras/${wallet.id}`}>
            <Card className='h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,6,23,0.24)]'>
                <CardHeader className='relative flex flex-row items-center justify-between space-y-0 pb-2'>
                    <div
                        className='absolute inset-x-5 top-0 h-16 rounded-b-[1.4rem] opacity-80 blur-2xl'
                        style={{ backgroundColor: wallet.color }}
                    />
                    <CardTitle className='relative text-lg font-medium text-white md:text-xl'>
                        {wallet.name}
                    </CardTitle>
                    <span className='relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]'>
                        <Icon className='h-5 w-5 text-white' />
                    </span>
                </CardHeader>
                <CardContent className='relative'>
                    <CurrencyDisplay amount={wallet.balance} showDecimals={true} className='text-2xl font-bold text-white md:text-3xl' />
                    <p className='mt-2 text-xs uppercase tracking-[0.24em] text-slate-500'>
                        {isCreditCard ? 'Deuda actual de la tarjeta' : wallet.type}
                    </p>
                    {isCreditCard && (
                        <>
                            <div className='mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300'>
                                Cupo disponible:{' '}
                                <CurrencyDisplay amount={wallet.availableCredit ?? 0} showDecimals={true} className='inline-block text-xs text-white' />
                                <p className='mt-2 text-slate-500'>
                                    Corte {wallet.statementClosingDay} · Pago {wallet.paymentDueDay}
                                </p>
                            </div>
                        </>
                    )}
                    {!wallet.includeInTotal && (
                        <p className='mt-3 text-xs text-slate-500'>
                            {isCreditCard ? 'Se muestra aparte del balance general' : 'No incluida en el balance total'}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
