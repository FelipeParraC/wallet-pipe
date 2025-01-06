export const revalidate = 0


import { getCategories, getTransactionsByWalletId, getWalletById, getWallets } from '@/actions'
import { BackButton, BalanceEvolutionChart, DailyExpensesChart, EditWalletButton, NewTransactionFloatingButton, TransactionsList, TripsAvailable, WalletInfo } from '@/components'
import { redirect } from 'next/navigation'

interface Props {
    params: { id: string }
}

export default async function BilleteraPage({ params }: Props) {

    const walletId = params.id
    const wallet = await getWalletById(walletId)
    const walllets = await getWallets()
    
    if (!wallet) {
        return <div>Cargando...</div>
    }

    if ( !wallet.isActive ) {
        redirect('/billeteras')
    }

    const transactions = await getTransactionsByWalletId( walletId )
    const balanceEvolutionChartTransactions = transactions?.map( t => t.toWalletId === walletId ? { ...t, amount: Math.abs(t.amount) } : t ) || null
    const dailyExpensesChartTransactions = transactions?.filter( t => t.type !== 'TRANSFERENCIA' ) || null
    const categories = await getCategories()

    return (
        <div className='space-y-6'>

            <div className="flex justify-between items-center w-full">
                <BackButton href='/billeteras' texto='Billeteras' />

                <EditWalletButton walletId={ wallet.id } />
            </div>

            <WalletInfo wallet={ wallet } />

            {wallet.type !== 'Transporte' ? (
                <>
                    <BalanceEvolutionChart transactions={ balanceEvolutionChartTransactions } color={ wallet.color } walletId={ wallet.id } />

                    <DailyExpensesChart transactions={ dailyExpensesChartTransactions } />
                </>
            ) : (
                <>
                    <TripsAvailable balance={ wallet.balance } fareValue={ wallet.fareValue || 1 } />
                </>
            )}

            <TransactionsList transactions={ transactions } walletId={ wallet.id } wallets={ walllets } categories={ categories } />
            
            <NewTransactionFloatingButton walletId={ walletId } />
        </div>
    )
}

