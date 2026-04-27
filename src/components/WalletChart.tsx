'use client'

import { format, parseISO } from 'date-fns'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Transaction } from '@/interfaces'
import { getWalletTransferDelta } from '@/lib/finance'
import { currencyFormatWithoutDecimals, formatCurrency } from '@/utils'

interface WalletChartProps {
    transactions: Transaction[] | null
    color: string
    walletId: string
    currentBalance: number
}

export const WalletChart = ({ transactions, color, walletId, currentBalance }: WalletChartProps) => {
    const orderedTransactions = [...(transactions ?? [])]
        .filter((transaction) => transaction.isVisible)
        .sort((a, b) => new Date(a.occurredAt || a.date).getTime() - new Date(b.occurredAt || b.date).getTime())

    const totalDelta = orderedTransactions.reduce((sum, transaction) => sum + getWalletTransferDelta(transaction, walletId), 0)
    const openingBalance = currentBalance - totalDelta
    let runningBalance = openingBalance

    const chartData = orderedTransactions.reduce<Array<{ date: string; label: string; balance: number }>>((acc, transaction) => {
        runningBalance += getWalletTransferDelta(transaction, walletId)
        const date = format(parseISO(transaction.occurredAt || transaction.date), 'yyyy-MM-dd')
        const existingEntry = acc.find((entry) => entry.date === date)

        if (existingEntry) {
            existingEntry.balance = runningBalance
            return acc
        }

        acc.push({
            date,
            label: format(parseISO(transaction.occurredAt || transaction.date), 'dd MMM'),
            balance: runningBalance,
        })
        return acc
    }, [])

    const data = chartData.length > 0
        ? [{ date: 'inicio', label: 'Inicio', balance: openingBalance }, ...chartData]
        : [{ date: 'actual', label: 'Actual', balance: currentBalance }]

    return (
        <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data} margin={{ left: 0, right: 6, top: 12, bottom: 0 }}>
                <defs>
                    <linearGradient id={`wallet-balance-${walletId}`} x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor={color} stopOpacity={0.46} />
                        <stop offset='95%' stopColor={color} stopOpacity={0.04} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke='rgba(255,255,255,0.08)' vertical={false} />
                <XAxis dataKey='label' tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => currencyFormatWithoutDecimals(Number(value))} width={78} />
                <Tooltip
                    cursor={{ stroke: 'rgba(148,163,184,0.22)', strokeWidth: 1 }}
                    contentStyle={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '18px',
                        background: 'rgba(2,6,23,0.88)',
                        color: '#f8fafc',
                        backdropFilter: 'blur(16px)',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                    labelFormatter={(label) => label}
                />
                <Area
                    type='monotone'
                    dataKey='balance'
                    stroke={color}
                    strokeWidth={3}
                    fill={`url(#wallet-balance-${walletId})`}
                    activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
