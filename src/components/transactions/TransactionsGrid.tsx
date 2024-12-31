'use client'

import { useState } from 'react'
import { TransactionDatePicker } from './TransactionDatePicker'
import type { Category, Transaction } from '@/interfaces'
import { format, parseISO } from 'date-fns'
import { TransactionList } from './TransactionList'
import { TransactionDetailsModal } from './TransactionDetailsModal'

interface TransactionsGridProps {
    transactions: Transaction[] | null
    categories: Category[] | null
}


export const TransactionsGrid = ({ transactions, categories }: TransactionsGridProps) => {

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    if ( !transactions || !categories ) {
        return <></>
    }

    const filteredTransactions = selectedDate
        ? transactions.filter(t => format(parseISO(t.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        : transactions

    return (
        <>
            <div className='w-full max-w-sm'>
                <TransactionDatePicker onDateSelect={ setSelectedDate } />
            </div>

            {filteredTransactions.length === 0 ? (
                <p className='text-center text-muted-foreground'>No hay transacciones para la fecha seleccionada.</p>
            ) : (
                <TransactionList
                    transactions={ filteredTransactions }
                    categories={ categories }
                    onSelect={ setSelectedTransaction }
                />
            )}

            <TransactionDetailsModal
                isOpen={ !!selectedTransaction }
                onClose={() => setSelectedTransaction(null)}
                transaction={ selectedTransaction }
                categories={ categories }
            />
        </>
    )
}
