"use client"

import { useState, useEffect } from 'react'
import { WalletForm } from "@/components/wallets/WalletForm"
import { useRouter, useParams } from 'next/navigation'
import { Wallet } from "@/types/wallet"
import { wallets } from "@/seed/data"

export default function EditarBilletera() {
    const router = useRouter()
    const { id } = useParams()
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined)

    useEffect(() => {
        const foundWallet = wallets.find(w => w.id === id)
        setWallet(foundWallet)
    }, [id])

    const handleSubmit = (walletData: Partial<Wallet>) => {
        // Aquí iría la lógica para actualizar la billetera
        console.log('Billetera actualizada:', walletData)
        // Después de actualizar, redirigimos a la página de billeteras
        router.push('/billeteras')
    }

    if (!wallet) {
        return <div>Cargando...</div>
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Editar Billetera</h1>
            <WalletForm wallet={wallet} onSubmit={handleSubmit} />
        </div>
    )
}

