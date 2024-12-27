"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Trash2, WalletIcon } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewTransactionFloatingButton } from "@/components/NewTransactionFloatingButton"
import { TransactionDatePicker } from "@/components/transactions/TransactionDatePicker"
import { TransactionActions } from "@/components/transactions/TransactionActions"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Transaction } from "@/types/transaction"
import type { Wallet } from "@/types/wallet"
import { wallets, initialTransactions } from "@/seed/data"

const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-500'
    if (amount < 0) return 'text-red-500'
    return 'text-yellow-500'
}

export default function WalletDetail() {
    const params = useParams()
    const router = useRouter()
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

    useEffect(() => {
        const foundWallet = wallets.find(w => w.id === params.id)
        setWallet(foundWallet)
        setTransactionHistory(initialTransactions.filter(t => t.wallet === foundWallet?.name))
    }, [params.id])

    const filteredTransactions = selectedDate
        ? transactionHistory.filter(t => isSameDay(parseISO(t.date), selectedDate))
        : transactionHistory

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link href="/billeteras" className="flex items-center text-blue-500 hover:text-blue-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Billeteras
                </Link>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => router.push(`/billeteras/editar/${wallet.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                    <Button asChild className="hidden md:inline-flex">
                        <Link href={`/transacciones/nueva?wallet=${wallet.id}`}>
                            <WalletIcon className="mr-2 h-4 w-4" /> Nueva Transacción
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">{wallet.name}</CardTitle>
                    <wallet.icon className="h-8 w-8 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${getAmountColor(wallet.balance)}`}>
                        ${wallet.balance.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                        Tipo: {wallet.type}
                    </p>
                    {!wallet.includeInTotal && (
                        <p className="text-sm text-yellow-500 mt-1">
                            No incluida en el balance total
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Evolución del Saldo</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={transactionHistory}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(parseISO(date), "dd/MM")}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `$${value}`}
                                tick={{ fontSize: 12 }}
                                width={60}
                            />
                            <Tooltip
                                labelFormatter={(date) => format(parseISO(date), "d 'de' MMMM, yyyy", { locale: es })}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Monto"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 w-full max-w-sm">
                        <TransactionDatePicker onDateSelect={setSelectedDate} />
                    </div>
                    {filteredTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground">No hay transacciones para la fecha seleccionada.</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredTransactions.map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-start border-b pb-4">
                                    <div>
                                        <p className="font-medium">{transaction.title}</p>
                                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(parseISO(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${getAmountColor(transaction.amount)}`}>
                                            ${Math.abs(transaction.amount).toFixed(2)}
                                        </div>
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

