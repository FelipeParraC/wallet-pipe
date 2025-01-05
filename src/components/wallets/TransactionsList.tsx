'use client'

import { useState } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import type { Category, Transaction, Wallet } from '@/interfaces'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { TransactionDatePicker } from '../transactions/TransactionDatePicker'
import { TransactionActions } from '../transactions/TransactionActions'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { useRouter } from 'next/navigation'
import { deleteTransactionById } from '@/actions'

interface TransactionsListProps {
    transactions: Transaction[] | null
    categories: Category[] | null
    walletId: string
    wallets: Wallet[] | null
}


export const TransactionsList = ({ transactions, categories, walletId, wallets }: TransactionsListProps) => {

    const router = useRouter()

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    if ( !transactions || !categories || !wallets ) {
        return null
    }
    
    const filteredTransactions = selectedDate
        ? transactions.filter(t => isSameDay(parseISO(t.date), selectedDate))
        : transactions

    const handleEdit = (transaction: Transaction) => {
        router.push(`/transacciones/editar/${ transaction.id }?walletId=${ walletId }`)
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        await deleteTransactionById( id )
        router.refresh()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='mb-4 w-full max-w-sm'>
                    <TransactionDatePicker onDateSelect={ setSelectedDate } />
                </div>
                {transactions.filter((transaction) => transaction.isVisible).length === 0 && (
                    <p className='text-center text-muted-foreground'>No hay transacciones aún</p>
                )}
                {filteredTransactions.length === 0 ? (
                    <p className='text-center text-muted-foreground'>No hay transacciones en este día</p>
                ) : (
                    <div className='space-y-4'>
                        {filteredTransactions.map((transaction) => transaction.isVisible && (
                            <div key={transaction.id} className='flex justify-between items-start border-b pb-4'>
                                <div>
                                    <p className='font-medium'>{ transaction.title }</p>
                                    <p className='text-sm text-muted-foreground'>{ categories.find( c => c.id === transaction.categoryId )?.name }</p>
                                    <p className='text-xs text-muted-foreground'>
                                        {format(parseISO( transaction.date ), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                                <div className='text-right flex flex-col items-end'>
                                    {transaction.numberOfTrips && transaction.fareValue ? (
                                        <>
                                            <p className='font-bold text-blue-500'>
                                                { transaction.numberOfTrips } viaje{ transaction.numberOfTrips > 1 ? 's' : '' }
                                            </p>
                                            <CurrencyDisplay
                                                amount={ transaction.fareValue * transaction.numberOfTrips }
                                                showDecimals={ true }
                                                className='font-bold text-red-500 mb-2'
                                            />
                                        </>
                                    ) : transaction.fromWalletId && transaction.fromWalletId ? (
                                        <>
                                            <p className='font-bold text-white'>
                                                {transaction.fromWalletId === walletId ? 'Transferencia a ' : 'Transferencia desde '}
                                                <span style={{ color: transaction.toWalletId === walletId
                                                    ? wallets.find(w => w.id === transaction.fromWalletId)?.color
                                                    : wallets.find(w => w.id === transaction.toWalletId)?.color
                                                }}>
                                                    {transaction.toWalletId === walletId
                                                        ? wallets.find(w => w.id === transaction.fromWalletId)?.name
                                                        : wallets.find(w => w.id === transaction.toWalletId)?.name
                                                    }  
                                                </span>
                                            </p>
                                            <CurrencyDisplay
                                                amount={ Math.abs(transaction.amount) }
                                                showDecimals={ true }
                                                className={`font-bold ${transaction.fromWalletId === walletId ? 'text-yellow-400' : 'text-blue-400'} mb-2`}
                                            />
                                        </>
                                    ) : (
                                        <CurrencyDisplay
                                            amount={Math.abs((transaction as Transaction).amount)}
                                            showDecimals={ true }
                                            className={`font-bold ${(transaction as Transaction).amount > 0 ? 'text-green-500' : 'text-red-500'} mb-2`}
                                        />
                                    )}
                                    <TransactionActions
                                        onEdit={() => handleEdit(transaction)}
                                        onDelete={() => handleDelete(transaction.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
