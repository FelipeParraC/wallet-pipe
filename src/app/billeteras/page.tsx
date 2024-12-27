import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from 'lucide-react'
import { wallets } from "@/seed/data"

export default function Billeteras() {
    const totalBalance = wallets
        .filter(wallet => wallet.includeInTotal)
        .reduce((sum, wallet) => sum + wallet.balance, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold md:text-3xl">Mis Billeteras</h1>

            <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-white text-3xl md:text-4xl">Balance Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl md:text-5xl font-bold text-white">${totalBalance.toFixed(2)}</p>
                    <p className="text-sm mt-2 text-blue-100">Total de todas las billeteras incluidas</p>
                </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                    <Link href={`/billeteras/${wallet.id}`} key={wallet.id}>
                        <Card className="hover:shadow-lg transition-shadow h-full" style={{ backgroundColor: wallet.color }}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg md:text-xl font-medium text-white">
                                    {wallet.name}
                                </CardTitle>
                                <wallet.icon className="h-8 w-8 text-white" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">${wallet.balance.toFixed(2)}</div>
                                <p className="text-xs text-white opacity-75 capitalize">
                                    Tipo: {wallet.type}
                                </p>
                                {!wallet.includeInTotal && (
                                    <p className="text-xs text-white opacity-75 mt-1">
                                        No incluida en el balance total
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                <Link href="/billeteras/nueva">
                    <Card className="hover:shadow-lg transition-shadow h-full border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer group">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <PlusCircle className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Nueva Billetera</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}

