
import { Transaction } from '@/interfaces'
import { NewTransactionFloatingButton, TransactionsGrid } from '@/components'
import { getTransactions } from '@/actions'

export default async function TransactionsPage() {

    const transactions = await getTransactions() as Transaction[]

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold md:text-3xl'>Todas las Transacciones</h1>
            </div>

            <TransactionsGrid transactions={ transactions } />

            <NewTransactionFloatingButton />
        </div>
    )
}

