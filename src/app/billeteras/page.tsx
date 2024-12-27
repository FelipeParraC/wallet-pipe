import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Wallet, CreditCard, Coins, Bitcoin } from 'lucide-react'

const wallets = [
    { id: 1, name: "Efectivo", balance: 500, type: "cash", icon: Coins, color: "bg-green-500" },
    { id: 2, name: "Cuenta Corriente", balance: 2500, type: "bank", icon: CreditCard, color: "bg-blue-500" },
    { id: 3, name: "Ahorros", balance: 10000, type: "savings", icon: Wallet, color: "bg-purple-500" },
    { id: 4, name: "Crypto", balance: 5000, type: "crypto", icon: Bitcoin, color: "bg-yellow-500" },
]

export default function Billeteras() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold md:text-3xl">Mis Billeteras</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Billetera
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                    <Link href={`/billeteras/${wallet.id}`} key={wallet.id}>
                        <Card className={`hover:shadow-lg transition-shadow ${wallet.color} text-white`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {wallet.name}
                                </CardTitle>
                                <wallet.icon className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${wallet.balance.toFixed(2)}</div>
                                <p className="text-xs opacity-75 capitalize">
                                    Tipo: {wallet.type}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}

