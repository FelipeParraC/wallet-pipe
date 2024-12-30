import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Card, CardContent } from "../ui"

export const NewWallet = () => {
    return (
        <Link href="/billeteras/nueva">
            <Card className="hover:shadow-lg transition-shadow h-full border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer group">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <PlusCircle className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Nueva Billetera</p>
                </CardContent>
            </Card>
        </Link>
    )
}
