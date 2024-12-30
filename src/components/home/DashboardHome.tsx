import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { Transaction, Wallet } from '@/interfaces'
import { QuickAccessCard, RecentTransactionItem, TotalAvailableCard, TotalExpensesCard, TotalIncomeCard, WalletItem } from '@/components'

//TODO: Remove seed data
import { currentUser } from '@/seed'

interface DashboardHomeProps {
    transactions: Transaction[]
    wallets: Wallet[]
}

export const DashboardHome = ({ transactions, wallets }: DashboardHomeProps) => {

    const recentTransactions = transactions.slice(0, 3)

    const totalBalance = wallets
        .filter(wallet => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    const walletsToInclude = new Set(wallets.filter(w => w.includeInTotal).map(w => w.id))

    const totalExpenses = transactions
        .filter(t => walletsToInclude.has(t.wallet) && t.amount < 0 && t.isVisible)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalIncome = transactions
        .filter(t => walletsToInclude.has(t.wallet) && t.amount > 0 && t.isVisible)
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className='space-y-6'>
            <h1 className='text-2xl font-bold md:text-3xl text-center'>
                {currentUser ? `Bienvenido, ${ currentUser.name }` : 'Bienvenido a Wallet Pipe'}
            </h1>

            <div className='grid gap-4 grid-cols-2 md:grid-cols-4'>
                
                <TotalAvailableCard totalBalance={ totalBalance } />

                <TotalExpensesCard totalExpenses={ totalExpenses } />

                <TotalIncomeCard totalIncome={ totalIncome } />
                
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Billeteras</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4 grid-cols-2 sm:grid-cols-4'>
                    {wallets.map((wallet) => (
                        <WalletItem key={ wallet.id } wallet={ wallet } />
                    ))}
                </CardContent>
            </Card>

            <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                    <CardHeader>
                        <CardTitle>Transacciones Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-8'>
                            {recentTransactions.filter((transaction) => transaction.isVisible).length === 0 && (
                                <p className='text-center text-muted-foreground'>No hay transacciones recientes</p>
                            )}
                            {recentTransactions.map((transaction, index) => transaction.isVisible && (
                                <RecentTransactionItem key={ index } transaction={ transaction } />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <QuickAccessCard />
            </div>
        </div>
    )
}
