import { Transaction } from '@/interfaces'
import { DailyTransactionsChart } from '../DailyTransactionsChart'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface DailyExpensesChartProps {
    transactions: Transaction[]
}


export const DailyExpensesChart = ({ transactions }: DailyExpensesChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gastos Diarios</CardTitle>
            </CardHeader>
            <CardContent className='h-[40vh] min-h-[300px]'>
                <DailyTransactionsChart transactions={ transactions } />
            </CardContent>
        </Card>
    )
}
