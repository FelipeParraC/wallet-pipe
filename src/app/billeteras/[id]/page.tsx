"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { format, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewTransactionFloatingButton } from "@/components/NewTransactionFloatingButton"
import { TransactionDatePicker } from "@/components/transactions/TransactionDatePicker"
import { TransactionActions } from "@/components/transactions/TransactionActions"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Transaction, BaseTransaction, isTransportTransaction, isTransferTransaction } from "@/types/transaction"
import type { Wallet } from "@/types/wallet"
import { wallets, initialTransactions } from "@/seed/data"
import { WalletChart } from "@/components/WalletChart"
import { DailyTransactionsChart } from "@/components/DailyTransactionsChart"
import { getAmountColor } from "@/utils/currency"
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

export default function WalletDetail() {
    const params = useParams()
    const router = useRouter()
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [pasajesDisponibles, setPasajesDisponibles] = useState<number>(0)
    const [pasajesPorDia, setPasajesPorDia] = useState<{ date: string; count: number; dayName: string }[]>([])

    const filteredTransactions = selectedDate
        ? transactionHistory.filter(t => isSameDay(parseISO(t.date), selectedDate))
        : transactionHistory

    useEffect(() => {
        const foundWallet = wallets.find(w => w.id === params.id)
        setWallet(foundWallet)
        const walletTransactions = initialTransactions.filter(t =>
            t.wallet === foundWallet?.id ||
            (isTransferTransaction(t) && (t.fromWallet === foundWallet?.id || t.toWallet === foundWallet?.id))
        )
        setTransactionHistory(walletTransactions)
        if (foundWallet && foundWallet.type === 'Transporte') {
            // const pasajesUsados = walletTransactions
            //     .filter(isTransportTransaction)
            //     .reduce((total, t) => total + t.numberOfTrips, 0)
            setPasajesDisponibles(Math.floor(foundWallet.balance / (foundWallet.fareValue || 1)))

            const pasajesPorDiaMap = walletTransactions
                .filter(isTransportTransaction)
                .reduce((acc, t) => {
                    const date = t.date.split('T')[0]
                    const dayName = format(parseISO(date), 'EEEEEE', { locale: es })
                    acc[date] = {
                        count: (acc[date]?.count || 0) + t.numberOfTrips,
                        dayName: dayName
                    }
                    return acc
                }, {} as Record<string, { count: number; dayName: string }>)

            setPasajesPorDia(Object.entries(pasajesPorDiaMap).map(([date, { count, dayName }]) => ({ date, count, dayName })))
        }
    }, [params.id])

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setIsEditModalOpen(true)
    }

    const handleDelete = (id: number) => {
        setTransactionHistory(transactionHistory.filter(t => t.id !== id))
    }

    const handleUpdateTransaction = (updatedTransaction: Transaction) => {
        setTransactionHistory(transactionHistory.map(t => t.id === updatedTransaction.id ? updatedTransaction : t))
        setIsEditModalOpen(false)
        setEditingTransaction(null)
    }

    if (!wallet) {
        return <div>Cargando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center w-full">
                <Link href="/billeteras" className="flex items-center text-blue-500 hover:text-blue-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Billeteras
                </Link>
                <Button variant="outline" onClick={() => router.push(`/billeteras/editar/${wallet.id}`)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">{wallet.name}</CardTitle>
                    <wallet.icon className="h-8 w-8 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CurrencyDisplay
                        amount={wallet.balance}
                        showDecimals={true}
                        className={`text-3xl font-bold ${getAmountColor(wallet.balance)}`}
                    />
                    <p className="text-sm text-muted-foreground capitalize">
                        {wallet.type}
                    </p>
                    {wallet.type === "Transporte" && wallet.fareValue && (
                        <p className="text-sm text-blue-500 mt-2">
                            Valor del pasaje: <CurrencyDisplay amount={wallet.fareValue} showDecimals={true} />
                        </p>
                    )}
                </CardContent>
            </Card>

            {wallet.type !== 'Transporte' ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Evolución del Saldo</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[40vh] min-h-[300px]">
                            <WalletChart transactions={transactionHistory} color={wallet.color} walletId={ wallet.id } />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gastos Diarios</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[40vh] min-h-[300px]">
                            <DailyTransactionsChart transactions={transactionHistory} />
                        </CardContent>
                    </Card>
                </>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pasajes Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-center">
                                {pasajesDisponibles}
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                Pasajes disponibles basados en el saldo actual
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Uso de Pasajes por Día</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[40vh] min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pasajesPorDia}>
                                    <XAxis
                                        dataKey="dayName"
                                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => `${value}, ${format(parseISO(pasajesPorDia.find(d => d.dayName === value)?.date || ''), 'dd/MM/yyyy')}`}
                                        formatter={(value) => [`${value} pasaje${value !== 1 ? 's' : ''}`, 'Cantidad']}
                                    />
                                    <Bar dataKey="count" fill={wallet.color} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 w-full max-w-sm">
                        <TransactionDatePicker onDateSelect={setSelectedDate} />
                    </div>
                    { transactionHistory.filter((transaction) => transaction.isVisible).length === 0 && (
                        <p className="text-center text-muted-foreground">No hay transacciones aún</p>
                    )}
                    {filteredTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground">No hay transacciones en este día</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredTransactions.map((transaction) => transaction.isVisible && (
                                <div key={transaction.id} className="flex justify-between items-start border-b pb-4">
                                    <div>
                                        <p className="font-medium">{transaction.title}</p>
                                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(parseISO(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        {isTransportTransaction(transaction) ? (
                                            <>
                                                <p className="font-bold text-blue-500">
                                                    {transaction.numberOfTrips} viaje{transaction.numberOfTrips > 1 ? 's' : ''}
                                                </p>
                                                <CurrencyDisplay
                                                    amount={transaction.fareValue * transaction.numberOfTrips}
                                                    showDecimals={true}
                                                    className="font-bold text-red-500 mb-2"
                                                />
                                            </>
                                        ) : isTransferTransaction(transaction) ? (
                                            <>
                                                <p className="font-bold text-white">
                                                    {transaction.fromWallet === wallet.id ? 'Transferencia a ' : 'Transferencia desde '}
                                                    <span style={{ color: wallets.find(w => w.id === (transaction.fromWallet === wallet.id ? transaction.toWallet : transaction.fromWallet))?.color }}>
                                                        {wallets.find(w => w.id === (transaction.fromWallet === wallet.id ? transaction.toWallet : transaction.fromWallet))?.name}
                                                    </span>
                                                </p>
                                                <CurrencyDisplay
                                                    amount={transaction.amount}
                                                    showDecimals={true}
                                                    className={`font-bold ${transaction.fromWallet === wallet.id ? 'text-yellow-400' : 'text-blue-400'} mb-2`}
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
            <NewTransactionFloatingButton walletId={wallet.id} />

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Transacción</DialogTitle>
                    </DialogHeader>
                    {editingTransaction && (
                        <TransactionForm
                            transaction={editingTransaction}
                            onSubmit={handleUpdateTransaction}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

