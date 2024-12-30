'use client'

import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "../ui"

interface EditButtonProps {
    walletId: string
}

export const EditWalletButton = ({ walletId }: EditButtonProps) => {

    const router = useRouter()

    return (
        <Button variant="outline" onClick={() => router.push(`/billeteras/editar/${ walletId }`)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
        </Button>
    )
}
