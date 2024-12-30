'use client'

import { Pencil } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

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
