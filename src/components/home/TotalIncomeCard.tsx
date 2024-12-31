'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TotalIncomeCardProps {
    totalIncome: number
}


export const TotalIncomeCard = ({ totalIncome }: TotalIncomeCardProps) => {

    const [expenses, setExpenses] = useState(0)

    useEffect(() => {
        totalIncome ? setExpenses(totalIncome) : 0
    }, [totalIncome])

    return (
        <Card className='bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                    Ingresos Totales
                </CardTitle>
                <TrendingUp className='h-4 w-4' />
            </CardHeader>
            <CardContent>
                <CurrencyDisplay
                    amount={ expenses }
                    showDecimals={ true }
                    className='text-lg font-bold md:text-2xl'
                />
                <p className='text-xs opacity-75'>
                    Total de ingresos
                </p>
            </CardContent>
        </Card>
    )
}
