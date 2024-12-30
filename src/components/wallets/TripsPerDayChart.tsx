import { format, parseISO } from "date-fns"
import type { Transaction } from "@/interfaces"
import { isTransportTransaction } from "@/interfaces"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "../ui"

interface TripsPerDayChartProps {
    transactions: Transaction[]
}

//TODO: Revisar el uso de la librería recharts

export const TripsPerDayChart = ({ transactions }: TripsPerDayChartProps) => {

    const pasajesPorDiaMap = transactions
        .filter(isTransportTransaction)
        .reduce((acc, t) => {
            const date = t.date.split('T')[0]
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
                <p>Hola</p>
                {/* <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={pasajesPorDia}>
                        <XAxis
                            dataKey='dayName'
                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(value) => `${value}, ${format(parseISO(pasajesPorDia.find(d => d.dayName === value)?.date || ''), 'dd/MM/yyyy')}`}
                            formatter={(value) => [`${value} pasaje${value !== 1 ? 's' : ''}`, 'Cantidad']}
                        />
                        <Bar dataKey='count' fill={ color } />
                    </BarChart>
                </ResponsiveContainer> */}
            </CardContent>
        </Card>
    )
}
