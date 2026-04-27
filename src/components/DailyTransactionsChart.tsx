'use client'

import { format, parseISO } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Transaction } from '@/interfaces'
import { currencyFormatWithoutDecimals, formatCurrency } from '@/utils'

interface DailyTransactionsChartProps {
    transactions: Transaction[] | null
}

export const DailyTransactionsChart = ({ transactions }: DailyTransactionsChartProps) => {
    const dailyData = (transactions ?? [])
        .filter((transaction) => transaction.isVisible && transaction.amount < 0 && transaction.type !== 'TRANSFERENCIA')
        .reduce<Record<string, { date: string; label: string; expense: number }>>((acc, transaction) => {
            const parsedDate = parseISO(transaction.occurredAt || transaction.date)
            const date = format(parsedDate, 'yyyy-MM-dd')

            if (!acc[date]) {
                acc[date] = {
                    date,
                    label: format(parsedDate, 'dd MMM'),
                    expense: 0,
                }
            }

            acc[date].expense += Math.abs(transaction.amount)
            return acc
        }, {})

    const data = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))

    if (data.length === 0) {
        return (
            <div className='flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] text-sm text-slate-400'>
                Sin gastos para graficar.
            </div>
        )
    }

    return (
        <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ left: 0, right: 6, top: 12, bottom: 0 }}>
                <CartesianGrid stroke='rgba(255,255,255,0.08)' vertical={false} />
                <XAxis dataKey='label' tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => currencyFormatWithoutDecimals(Number(value))} width={78} />
                <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    contentStyle={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '18px',
                        background: 'rgba(2,6,23,0.88)',
                        color: '#f8fafc',
                        backdropFilter: 'blur(16px)',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Gasto']}
                />
                <Bar dataKey='expense' fill='#fb7185' radius={[12, 12, 4, 4]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
