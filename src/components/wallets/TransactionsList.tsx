'use client'

import { useState } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import type { BaseTransaction, Transaction, Wallet } from '@/interfaces'
import { isTransportTransaction, isTransferTransaction } from '@/interfaces'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { TransactionDatePicker } from '../transactions/TransactionDatePicker'
import { TransactionActions } from '../transactions/TransactionActions'
import { CurrencyDisplay } from '../CurrencyDisplay'

interface TransactionsListProps {
    transactions: Transaction[]
    walletId: string
    wallets: Wallet[]
}


export const TransactionsList = ({ transactions, walletId, wallets }: TransactionsListProps) => {

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const filteredTransactions = selectedDate
        ? transactions.filter(t => isSameDay(parseISO(t.date), selectedDate))
        : transactions

    const handleEdit = (transaction: Transaction) => {
        console.log(transaction)
        // TODO: Revisar esto
    }

    const handleDelete = (id: string) => {
        console.log(id)
        // TODO: Revisar esto
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='mb-4 w-full max-w-sm'>
                    <TransactionDatePicker onDateSelect={setSelectedDate} />
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
                                    <p className='font-medium'>{transaction.title}</p>
                                    <p className='text-sm text-muted-foreground'>{transaction.category}</p>
                                    <p className='text-xs text-muted-foreground'>
                                        {format(parseISO(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                                <div className='text-right flex flex-col items-end'>
                                    {isTransportTransaction(transaction) ? (
                                        <>
                                            <p className='font-bold text-blue-500'>
                                                {transaction.numberOfTrips} viaje{transaction.numberOfTrips > 1 ? 's' : ''}
                                            </p>
                                            <CurrencyDisplay
                                                amount={transaction.fareValue * transaction.numberOfTrips}
                                                showDecimals={true}
                                                className='font-bold text-red-500 mb-2'
                                            />
                                        </>
                                    ) : isTransferTransaction(transaction) ? (
                                        <>
                                            <p className='font-bold text-white'>
                                                {transaction.fromWallet === walletId ? 'Transferencia a ' : 'Transferencia desde '}
                                                <span style={{ color: wallets.find(w => w.id === transaction.fromWallet)?.color }}>
                                                    {wallets.find(w => w.id === transaction.fromWallet)?.name}
                                                </span>
                                            </p>
                                            <CurrencyDisplay
                                                amount={transaction.amount}
                                                showDecimals={true}
                                                className={`font-bold ${transaction.fromWallet === walletId ? 'text-yellow-400' : 'text-blue-400'} mb-2`}
                                            />
                                        </>
                                    ) : (
                                        <CurrencyDisplay
                                            amount={Math.abs((transaction as BaseTransaction).amount)}
                                            showDecimals={true}
                                            className={`font-bold ${(transaction as BaseTransaction).amount > 0 ? 'text-green-500' : 'text-red-500'} mb-2`}
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
