export const revalidate = 0


import { getCategories, getTransactionsByWalletId, getWalletById, getWallets } from '@/actions'
import { BackButton, BalanceEvolutionChart, DailyExpensesChart, EditWalletButton, NewTransactionFloatingButton, SavingsBoxMoneyDialog, TransactionsList, TripsAvailable, WalletInfo, WalletSavingsBoxesSection } from '@/components'
import { ArrowDownToLine, ArrowUpFromLine, PiggyBank } from 'lucide-react'
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
    const parentWallet = wallet.isSavingsBox ? wallets?.find((item) => item.id === wallet.parentWalletId) : null

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    const balanceEvolutionChartTransactions = transactions || null
    const dailyExpensesChartTransactions = transactions?.filter( t => t.type !== 'TRANSFERENCIA' ) || null

    return (
        <div className='space-y-6'>

            <div className="flex justify-between items-center w-full">
                <BackButton href='/billeteras' texto='Cuentas' />

                <EditWalletButton walletId={ wallet.id } />
            </div>

            <WalletInfo wallet={ wallet } />

            {wallet.isSavingsBox && parentWallet ? (
                <section className='space-y-3'>
                    <div className='rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 sm:p-5'>
                        <div className='flex items-start gap-3'>
                            <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-100'>
                                <PiggyBank className='h-5 w-5' />
                            </span>
                            <div className='min-w-0'>
                                <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Cajita de</p>
                                <p className='mt-1 truncate text-lg font-semibold text-white'>{parentWallet.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                        <SavingsBoxMoneyDialog
                            savingsBox={wallet}
                            parentWallet={parentWallet}
                            direction='ADD'
                            trigger={(
                                <span className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 px-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)]'>
                                    <ArrowDownToLine className='h-4 w-4' />
                                    Agregar
                                </span>
                            )}
                        />
                        <SavingsBoxMoneyDialog
                            savingsBox={wallet}
                            parentWallet={parentWallet}
                            direction='WITHDRAW'
                            trigger={(
                                <span className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white'>
                                    <ArrowUpFromLine className='h-4 w-4' />
                                    Sacar
                                </span>
                            )}
                        />
                    </div>
                </section>
            ) : (
                <WalletSavingsBoxesSection wallet={wallet} wallets={wallets ?? []} />
            )}

            {wallet.type !== 'Transporte' ? (
                <>
                    <BalanceEvolutionChart transactions={ balanceEvolutionChartTransactions } color={ wallet.color } walletId={ wallet.id } currentBalance={ wallet.balance } />

                    <DailyExpensesChart transactions={ dailyExpensesChartTransactions } />
                </>
            ) : (
                <>
                    <TripsAvailable balance={ wallet.balance } fareValue={ wallet.fareValue || 1 } />
                </>
            )}

            <TransactionsList transactions={ transactions } walletId={ wallet.id } wallets={ wallets } categories={ categories } />
            
            {!wallet.isSavingsBox && <NewTransactionFloatingButton walletId={ walletId } />}
        </div>
    )
}

