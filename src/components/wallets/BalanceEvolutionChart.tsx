import type { Transaction } from '@/interfaces'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { WalletChart } from '../WalletChart'

interface BalanceEvolutionChartProps {
    walletId: string
    color: string
    transactions: Transaction[] | null
}


export const BalanceEvolutionChart = ({ color, transactions, walletId }: BalanceEvolutionChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Evolución del Saldo</CardTitle>
            </CardHeader>
            <CardContent className='h-[40vh] min-h-[300px]'>
                <WalletChart transactions={ transactions } color={ color } walletId={ walletId } />
            </CardContent>
        </Card>
    )
}
