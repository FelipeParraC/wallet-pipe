import { getTransactionsByWalletId, getWalletById, getWallets } from '@/actions'
import { BackButton, BalanceEvolutionChart, DailyExpensesChart, EditWalletButton, NewTransactionFloatingButton, TransactionsList, TripsAvailable, WalletInfo } from '@/components'

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

    const transactions = await getTransactionsByWalletId( walletId )

    return (
        <div className='space-y-6'>

            <div className="flex justify-between items-center w-full">
                <BackButton href='/billeteras' texto='Billeteras' />

                <EditWalletButton walletId={ wallet.id } />
            </div>

            <WalletInfo wallet={ wallet } />

            {wallet.type !== 'Transporte' ? (
                <>
                    <BalanceEvolutionChart transactions={ transactions } color={ wallet.color } walletId={ wallet.id } />

                    <DailyExpensesChart transactions={ transactions } />
                </>
            ) : (
                <>
                    <TripsAvailable balance={ wallet.balance } fareValue={ wallet.fareValue || 1 } />
                </>
            )}

            <TransactionsList transactions={ transactions } walletId={ wallet.id } wallets={ walllets } />
            
            <NewTransactionFloatingButton walletId={ wallet.id } />
        </div>
    )
}

