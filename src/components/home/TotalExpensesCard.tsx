'use client'

import { TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { useEffect, useState } from 'react'

interface TotalExpensesCardProps {
    totalExpenses: number
}


export const TotalExpensesCard = ({ totalExpenses }: TotalExpensesCardProps) => {

    const [expenses, setExpenses] = useState(0)

    useEffect(() => {
        const gastosTotales = totalExpenses ? totalExpenses : 0
        setExpenses(gastosTotales)
    }, [totalExpenses])

    return (
        <Card className='bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                    Gastos Totales
                </CardTitle>
                <TrendingDown className='h-4 w-4' />
            </CardHeader>
            <CardContent>
                <CurrencyDisplay
                    amount={ expenses }
                    showDecimals={ true }
                    className='text-lg font-bold md:text-2xl'
                />
                <p className='text-xs opacity-75'>
                    Total de gastos
                </p>
            </CardContent>
        </Card>
    )
}
