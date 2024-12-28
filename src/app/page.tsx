import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Wallet, Receipt, PieChart, Settings, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { NewTransactionFloatingButton } from "@/components/NewTransactionFloatingButton"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { wallets, initialTransactions, currentUser } from "@/seed/data"
import { getAmountColor } from "@/utils/currency"
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

const quickLinks = [
    { name: 'Transacciones', href: '/transacciones', icon: Receipt },
    { name: 'Billeteras', href: '/billeteras', icon: Wallet },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
]

const recentTransactions = initialTransactions.slice(0, 3);

export default function Dashboard() {
    const totalBalance = wallets
        .filter(wallet => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0);

    const walletsToInclude = new Set(wallets.filter(w => w.includeInTotal).map(w => w.id));

    const totalExpenses = initialTransactions
        .filter(t => walletsToInclude.has(t.wallet) && t.amount < 0 && t.isVisible)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = initialTransactions
        .filter(t => walletsToInclude.has(t.wallet) && t.amount > 0 && t.isVisible)
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold md:text-3xl text-center">
                {currentUser ? `Bienvenido, ${currentUser.name}` : 'Bienvenido a Wallet Pipe'}
            </h1>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white col-span-2 md:col-span-4 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Disponible
                        </CardTitle>
                        <Wallet className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay
                            amount={totalBalance}
                            showDecimals={true}
                            className="text-2xl font-bold md:text-3xl text-white"
                        />
                        <p className="text-xs opacity-75">
                            Balance total de todas las billeteras incluidas
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos Totales
                        </CardTitle>
                        <TrendingDown className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay
                            amount={totalExpenses}
                            showDecimals={true}
                            className="text-lg font-bold md:text-2xl"
                        />
                        <p className="text-xs opacity-75">
                            Total de gastos
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <CurrencyDisplay
                            amount={totalIncome}
                            showDecimals={true}
                            className="text-lg font-bold md:text-2xl"
                        />
                        <p className="text-xs opacity-75">
                            Total de ingresos
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
                            <Card className={`text-white hover:shadow-lg transition-shadow h-full`} style={{ backgroundColor: wallet.color }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">{wallet.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CurrencyDisplay
                                        amount={wallet.balance}
                                        showDecimals={true}
                                        className="text-base font-bold truncate text-white"
                                    />
                                    <p className="text-xs opacity-75 capitalize">
                                        {wallet.type}
                                    </p>
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
                            { recentTransactions.filter((transaction) => transaction.isVisible).length === 0 && (
                                <p className="text-center text-muted-foreground">No hay transacciones recientes</p>
                            )}
                            {recentTransactions.map((transaction, index) => transaction.isVisible && (
                                <div key={index} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{transaction.title}</p>
                                        <p className="text-xs text-muted-foreground">{transaction.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className={`ml-auto font-medium ${ transaction.category !== 'Transferencia' ? getAmountColor(transaction.amount) : 'text-blue-400' }`}>
                                        <CurrencyDisplay
                                            amount={Math.abs(transaction.amount)}
                                            showDecimals={true}
                                        />
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
                        <Button asChild className="h-20 flex-col items-center justify-center bg-blue-700 hover:bg-blue-600 col-span-2 md:flex hidden">
                            <Link href="/transacciones/nueva" className="text-white">
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

