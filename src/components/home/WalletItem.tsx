import Link from 'next/link'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import type { Wallet } from '@/interfaces'

interface WalletItemProps {
    wallet: Wallet
}


export const WalletItem = ({ wallet }: WalletItemProps) => {
    return (
        <Link href={`/billeteras/${ wallet.id }`} className='block'>
            <Card className={`text-white hover:shadow-lg transition-shadow h-full`} style={{ backgroundColor: wallet.color }}>
                <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>{ wallet.name }</CardTitle>
                </CardHeader>
                <CardContent>
                    <CurrencyDisplay
                        amount={ wallet.balance }
                        showDecimals={ true }
                        className='text-base font-bold truncate text-white'
                    />
                    <p className='text-xs opacity-75 capitalize'>
                        { wallet.type }
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
