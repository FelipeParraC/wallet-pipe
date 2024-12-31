'use client'

import { Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { useEffect, useState } from 'react'

interface TotalAvailableCardProps {
    totalBalance: number
}


export const TotalAvailableCard = ({ totalBalance }: TotalAvailableCardProps) => {

    const [balance, setBalance] = useState(0)

    useEffect(() => {
        const balanceTotal = totalBalance ? totalBalance : 0
        setBalance(balanceTotal)
    }, [totalBalance])

    return (
        <Card className='bg-gradient-to-r from-blue-600 to-blue-800 text-white col-span-2 md:col-span-4 shadow-lg'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                    Total Disponible
                </CardTitle>
                <Wallet className='h-4 w-4' />
            </CardHeader>
            <CardContent>
                <CurrencyDisplay
                    amount={ balance }
                    showDecimals={ true }
                    className='text-2xl font-bold md:text-3xl text-white'
                />
                <p className='text-xs opacity-75'>
                    Balance total de todas las billeteras incluidas
                </p>
            </CardContent>
        </Card>
    )
}
