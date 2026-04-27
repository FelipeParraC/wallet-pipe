'use client'

import { format, parseISO } from "date-fns"
import type { Transaction } from "@/interfaces"
import { isTransportTransaction } from "@/interfaces"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "../ui"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface TripsPerDayChartProps {
    transactions: Transaction[]
}

export const TripsPerDayChart = ({ transactions }: TripsPerDayChartProps) => {

    const pasajesPorDiaMap = transactions
        .filter(isTransportTransaction)
        .reduce((acc, t) => {
            const date = (t.occurredAt || t.date).split('T')[0]
            const dayName = format(parseISO(date), 'EEEEEE', { locale: es })
            acc[date] = {
                count: (acc[date]?.count || 0) + t.numberOfTrips,
                dayName: dayName
            }
            return acc
        }, {} as Record<string, { count: number; dayName: string }>)

    const pasajesPorDia = Object.entries(pasajesPorDiaMap).map(([date, { count, dayName }]) => ({ date, count, dayName }))

    if (pasajesPorDia.length === 0) {
        return <></>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Uso de Pasajes por Día</CardTitle>
            </CardHeader>
            <CardContent className='h-[40vh] min-h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={pasajesPorDia}>
                        <CartesianGrid stroke='rgba(255,255,255,0.08)' vertical={false} />
                        <XAxis
                            dataKey='dayName'
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                            contentStyle={{
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '18px',
                                background: 'rgba(2,6,23,0.88)',
                                color: '#f8fafc',
                                backdropFilter: 'blur(16px)',
                            }}
                            labelFormatter={(value) => `${value}, ${format(parseISO(pasajesPorDia.find(d => d.dayName === value)?.date || ''), 'dd/MM/yyyy')}`}
                            formatter={(value) => [`${value} pasaje${value !== 1 ? 's' : ''}`, 'Cantidad']}
                        />
                        <Bar dataKey='count' fill='#38bdf8' radius={[12, 12, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
