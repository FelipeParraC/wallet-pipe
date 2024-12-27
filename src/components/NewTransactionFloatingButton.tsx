"use client"

import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NewTransactionFloatingButton({ walletId }: { walletId?: string }) {
    const pathname = usePathname()
    const isVisible = pathname === '/' || pathname.startsWith('/billeteras/')

    if (!isVisible) return null

    const href = walletId
        ? `/transacciones/nueva?wallet=${walletId}`
        : '/transacciones/nueva'

    return (
        <Button
            asChild
            className="fixed bottom-4 right-4 rounded-full p-0 w-12 h-12 shadow-lg md:hidden bg-blue-600 hover:bg-blue-700"
        >
            <Link href={href}>
                <Plus className="h-5 w-5" />
                <span className="sr-only">Nueva Transacción</span>
            </Link>
        </Button>
    )
}

