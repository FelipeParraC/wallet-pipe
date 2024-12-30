import { currencyFormatWithSmallDecimals } from '@/utils'
import type { Wallet } from '@/interfaces'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'

interface TotalBalanceProps {
    wallets: Wallet[]
}


export const WalletsTotalBalance = ({ wallets }: TotalBalanceProps) => {

    const totalBalance = wallets
        .filter(wallet => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    return (
        <Card className='bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg'>
            <CardHeader>
                <CardTitle className='text-white text-3xl md:text-4xl'>Balance Total</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='text-4xl md:text-5xl font-bold text-white currency-with-small-decimals' dangerouslySetInnerHTML={{ __html: currencyFormatWithSmallDecimals( totalBalance ) }} />
                <p className='text-sm mt-2 text-blue-100'>Total de todas las billeteras incluidas</p>
            </CardContent>
        </Card>
    )
}
