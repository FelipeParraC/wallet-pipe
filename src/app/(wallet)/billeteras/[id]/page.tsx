export const revalidate = 0


import { getCategories, getTransactionsByWalletId, getWalletById, getWallets } from '@/actions'
import { BackButton, BalanceEvolutionChart, DailyExpensesChart, EditWalletButton, NewTransactionFloatingButton, TransactionsList, TripsAvailable, WalletInfo } from '@/components'
import { redirect } from 'next/navigation'

interface Props {
    params: { id: string }
}

export default async function BilleteraPage({ params }: Props) {

    const walletId = params.id
    const respWallet = await getWalletById( walletId )

    if ( !respWallet.ok ) {
        redirect('/billeteras')
    }

    const wallet = respWallet.wallet
    
    if (!wallet) {
        return <div>Cargando...</div>
    }

    if ( !wallet.isActive ) {
        redirect('/billeteras')
    }

    const respTransactions = await getTransactionsByWalletId( walletId )
    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    const balanceEvolutionChartTransactions = transactions?.map( t => t.toWalletId === walletId ? { ...t, amount: Math.abs(t.amount) } : t ) || null
    const dailyExpensesChartTransactions = transactions?.filter( t => t.type !== 'TRANSFERENCIA' ) || null

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

            <TransactionsList transactions={ transactions } walletId={ wallet.id } wallets={ wallets } categories={ categories } />
            
            <NewTransactionFloatingButton walletId={ walletId } />
        </div>
    )
}

