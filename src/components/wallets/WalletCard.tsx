import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Wallet } from '@/interfaces'
import { currencyFormatWithSmallDecimals, getIcon } from '@/utils'

interface WalletCardProps {
    wallet: Wallet
}


export const WalletCard = ({ wallet }: WalletCardProps) => {

    const Icon = getIcon( wallet.type )

    return (
        <Link href={`/billeteras/${wallet.id}`}>
            <Card className='hover:shadow-lg transition-shadow h-full' style={{ backgroundColor: wallet.color }}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-lg md:text-xl font-medium text-white'>
                        {wallet.name}
                    </CardTitle>
                    <Icon className='h-8 w-8 text-white' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold text-white currency-with-small-decimals' dangerouslySetInnerHTML={{ __html: currencyFormatWithSmallDecimals(wallet.balance) }} />
                    <p className='text-xs text-white opacity-75 capitalize'>
                        {wallet.type}
                    </p>
                    {!wallet.includeInTotal && (
                        <p className='text-xs text-white opacity-75 mt-1'>
                            No incluida en el balance total
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
