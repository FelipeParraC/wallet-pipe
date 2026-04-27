import type { Wallet } from '@/interfaces'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'

interface TotalBalanceProps {
    wallets: Wallet[]
}


export const WalletsTotalBalance = ({ wallets }: TotalBalanceProps) => {

    const totalBalance = wallets
        .filter(wallet => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    return (
        <Card className='rounded-[2rem] overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(7,16,30,0.82),rgba(9,19,36,0.66))] text-white shadow-[0_24px_70px_rgba(2,6,23,0.34)]'>
            <CardHeader>
                <CardTitle className='text-white text-2xl md:text-3xl'>Balance total</CardTitle>
            </CardHeader>
            <CardContent>
                <CurrencyDisplay amount={totalBalance} showDecimals={true} className='text-4xl font-bold text-white md:text-5xl' />
            </CardContent>
        </Card>
    )
}
