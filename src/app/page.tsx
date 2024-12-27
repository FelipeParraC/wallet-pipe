import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Wallet, Receipt, PieChart, User, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewTransactionFloatingButton } from "@/components/NewTransactionFloatingButton"

const quickLinks = [
    { name: 'Transacciones', href: '/transacciones', icon: Receipt },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Perfil', href: '/perfil', icon: User },
]

const wallets = [
    { id: "1", name: "Efectivo", balance: 500, color: "bg-green-600" },
    { id: "2", name: "Cuenta Corriente", balance: 2500, color: "bg-blue-600" },
    { id: "3", name: "Ahorros", balance: 10000, color: "bg-purple-600" },
    { id: "4", name: "Crypto", balance: 5000, color: "bg-yellow-600" },
]

const recentTransactions = [
    { date: "2023-04-01", title: "Compra semanal", category: "Alimentación", amount: -120.50 },
    { date: "2023-04-02", title: "Gasolina", category: "Transporte", amount: -45.00 },
    { date: "2023-04-03", title: "Cena con amigos", category: "Entretenimiento", amount: -65.75 },
]

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold md:text-3xl text-center">Bienvenido a Wallet Pipe</h1>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-blue-600 text-white col-span-2 md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Disponible
                        </CardTitle>
                        <Wallet className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold md:text-3xl">$24,500.00</div>
                        <p className="text-xs opacity-75">
                            +20.1% desde el mes pasado
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-red-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos del Mes
                        </CardTitle>
                        <TrendingDown className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold md:text-2xl">$3,250.00</div>
                        <p className="text-xs opacity-75">
                            -4.5% desde el mes pasado
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-green-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos del Mes
                        </CardTitle>
                        <TrendingUp className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold md:text-2xl">$5,750.00</div>
                        <p className="text-xs opacity-75">
                            +12.3% desde el mes pasado
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Billeteras</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    {wallets.map((wallet) => (
                        <Link href={`/billeteras/${wallet.id}`} key={wallet.id} className="block">
                            <Card className={`${wallet.color} text-white hover:shadow-lg transition-shadow h-full`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">{wallet.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold">${wallet.balance.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Transacciones Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentTransactions.map((transaction, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{transaction.title}</p>
                                        <p className="text-xs text-muted-foreground">{transaction.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className={`ml-auto font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {transaction.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Accesos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {quickLinks.map((link) => (
                            <Button key={link.name} asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                                <Link href={link.href}>
                                    <link.icon className="h-6 w-6 mb-2" />
                                    {link.name}
                                </Link>
                            </Button>
                        ))}
                        <Button asChild className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 col-span-2 md:flex">
                            <Link href="/transacciones/nueva">
                                <PlusCircle className="h-6 w-6 mb-2" />
                                Nueva Transacción
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <NewTransactionFloatingButton />
        </div>
    )
}

