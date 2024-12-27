"use client"

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Trash2, Wallet, CreditCard, Coins, Bitcoin } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewTransactionFloatingButton } from "@/components/NewTransactionFloatingButton"

const wallets = [
    { id: "1", name: "Efectivo", balance: 500, type: "cash", icon: Coins },
    { id: "2", name: "Cuenta Corriente", balance: 2500, type: "bank", icon: CreditCard },
    { id: "3", name: "Ahorros", balance: 10000, type: "savings", icon: Wallet },
    { id: "4", name: "Crypto", balance: 5000, type: "crypto", icon: Bitcoin },
]

const transactionHistory = [
    { date: '2023-05-01', amount: -50, category: 'Alimentación', description: 'Compra en supermercado' },
    { date: '2023-05-02', amount: 1000, category: 'Ingresos', description: 'Pago de salario' },
    { date: '2023-05-03', amount: -30, category: 'Transporte', description: 'Recarga de tarjeta de transporte' },
    { date: '2023-05-04', amount: -100, category: 'Entretenimiento', description: 'Cena en restaurante' },
    { date: '2023-05-05', amount: 0, category: 'Transferencia', description: 'Movimiento entre cuentas' },
]

const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-600'
    if (amount < 0) return 'text-red-600'
    return 'text-yellow-600'
}

export default function WalletDetail() {
    const params = useParams()
    const wallet = wallets.find(w => w.id === params.id) || wallets[0]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link href="/billeteras" className="flex items-center text-blue-500 hover:text-blue-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Billeteras
                </Link>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                    <Button asChild className="hidden md:inline-flex">
                        <Link href={`/transacciones/nueva?wallet=${wallet.id}`}>
                            <Wallet className="mr-2 h-4 w-4" /> Nueva Transacción
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Evolución del Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={transactionHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transacciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactionHistory.map((transaction, index) => (
                            <div key={index} className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{transaction.category}</p>
                                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                                <div className={`font-bold ${getAmountColor(transaction.amount)}`}>
                                    ${Math.abs(transaction.amount).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <NewTransactionFloatingButton walletId={wallet.id} />
        </div>
    )
}

