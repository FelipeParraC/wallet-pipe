'use client'

import { format, parseISO } from 'date-fns'
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Transaction } from '@/interfaces'
import { currencyFormatWithoutDecimals, formatCurrency } from '@/utils'

interface CycleEvolutionChartProps {
  transactions: Transaction[]
}

export const CycleEvolutionChart = ({ transactions }: CycleEvolutionChartProps) => {
  const grouped = transactions
    .filter((transaction) => transaction.isVisible && transaction.type !== 'TRANSFERENCIA')
    .reduce<Record<string, { date: string; label: string; income: number; expense: number; net: number }>>((acc, transaction) => {
      const parsedDate = parseISO(transaction.occurredAt || transaction.date)
      const date = format(parsedDate, 'yyyy-MM-dd')

      if (!acc[date]) {
        acc[date] = {
          date,
          label: format(parsedDate, 'dd MMM'),
          income: 0,
          expense: 0,
          net: 0,
        }
      }

      if (transaction.amount > 0) acc[date].income += transaction.amount
      if (transaction.amount < 0) acc[date].expense += Math.abs(transaction.amount)
      acc[date].net += transaction.amount
      return acc
    }, {})

  let cumulative = 0
  const data = Object.values(grouped)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => {
      cumulative += item.net
      return { ...item, cumulative }
    })

  if (data.length === 0) {
    return (
      <div className='flex h-full min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] text-sm text-slate-400'>
        Sin movimientos del ciclo para graficar.
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <ComposedChart data={data} margin={{ left: 0, right: 6, top: 12, bottom: 0 }}>
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
          formatter={(value, name) => [formatCurrency(Number(value)), name === 'income' ? 'Ingresos' : name === 'expense' ? 'Gastos' : 'Neto acumulado']}
        />
        <Bar dataKey='income' fill='#34d399' radius={[10, 10, 4, 4]} />
        <Bar dataKey='expense' fill='#fb7185' radius={[10, 10, 4, 4]} />
        <Area type='monotone' dataKey='cumulative' stroke='#38bdf8' strokeWidth={3} fill='rgba(56,189,248,0.12)' />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
