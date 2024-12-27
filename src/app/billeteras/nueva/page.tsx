"use client"

import { WalletForm } from "@/components/wallets/WalletForm"
import { useRouter } from 'next/navigation'
import { Wallet } from "@/types/wallet"

export default function NuevaBilletera() {
    const router = useRouter()

    const handleSubmit = (walletData: Partial<Wallet>) => {
        // Aquí iría la lógica para guardar la nueva billetera
        console.log('Nueva billetera:', walletData)
        // Después de guardar, redirigimos a la página de billeteras
        router.push('/billeteras')
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Crear Nueva Billetera</h1>
            <WalletForm onSubmit={handleSubmit} />
        </div>
    )
}

