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
        ? transactions.filter(t => format(parseISO(t.occurredAt || t.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        : transactions

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
