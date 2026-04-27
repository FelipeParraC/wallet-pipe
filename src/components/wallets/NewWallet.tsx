import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Card, CardContent } from "../ui"

export const NewWallet = () => {
    return (
        <Link href="/billeteras/nueva">
            <Card className="group flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_rgba(2,6,23,0.24)]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <span className='flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-sky-400/20 to-blue-500/10 text-sky-200'>
                        <PlusCircle className="h-8 w-8 transition-colors group-hover:text-white" />
                    </span>
                    <p className="mt-4 text-lg font-medium text-white transition-colors">Nueva cuenta</p>
                </CardContent>
            </Card>
        </Link>
    )
}
