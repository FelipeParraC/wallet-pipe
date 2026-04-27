'use client'

import { useState } from 'react'
import { TransactionDatePicker } from './TransactionDatePicker'
import type { Category, Transaction, Wallet } from '@/interfaces'
import { format, parseISO } from 'date-fns'
import { TransactionList } from './TransactionList'
import { TransactionDetailsModal } from './TransactionDetailsModal'
import { useRouter } from 'next/navigation'
import { deleteTransactionById } from '@/actions'

interface TransactionsGridProps {
    transactions: Transaction[] | null
    categories: Category[] | null
    wallets: Wallet[] | null
    contextWalletId?: string
}


export const TransactionsGrid = ({ transactions, categories, wallets, contextWalletId }: TransactionsGridProps) => {

    const router = useRouter()
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    if ( !transactions || !categories || !wallets ) {
        return <></>
    }

    const filteredTransactions = selectedDate
        ? transactions.filter(t => format(parseISO(t.occurredAt || t.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        : transactions

    const handleEdit = (transaction: Transaction) => {
        const suffix = contextWalletId ? `?walletId=${contextWalletId}` : ''
        router.push(`/transacciones/editar/${transaction.id}${suffix}`)
    }

    const handleDelete = async (transaction: Transaction) => {
        const response = await deleteTransactionById(transaction.id)
        if (response.ok) {
            setSelectedTransaction(null)
            router.refresh()
        }
    }

    return (
        <>
            <div className='glass-panel w-full max-w-sm rounded-[1.75rem] p-3'>
                <TransactionDatePicker onDateSelect={ setSelectedDate } />
            </div>

            {filteredTransactions.length === 0 ? (
                <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
                    <p className='text-sm text-slate-400'>No hay movimientos para la fecha seleccionada.</p>
                </div>
            ) : (
                <TransactionList
                    transactions={ filteredTransactions }
                    categories={ categories }
                    wallets={ wallets }
                    contextWalletId={ contextWalletId }
                    onSelect={ setSelectedTransaction }
                />
            )}

            <TransactionDetailsModal
                isOpen={ !!selectedTransaction }
                onClose={() => setSelectedTransaction(null)}
                transaction={ selectedTransaction }
                categories={ categories }
                wallets={ wallets }
                onEdit={ handleEdit }
                onDelete={ handleDelete }
            />
        </>
    )
}
