"use client"

import { useState, useEffect } from 'react'
import { WalletForm } from "@/components/wallets/WalletForm"
import { useRouter, useParams } from 'next/navigation'
import { Wallet } from "@/types/wallet"
import { wallets } from "@/seed/data"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function EditarBilletera() {
    const router = useRouter()
    const { id } = useParams()
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    const handleDeleteWallet = () => {
        // Aquí iría la lógica para eliminar la billetera
        console.log('Billetera eliminada:', wallet?.id);
        router.push('/billeteras');
    };

    if (!wallet) {
        return <div>Cargando...</div>
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Editar Billetera</h1>
            <WalletForm wallet={wallet} onSubmit={handleSubmit} />
            <div className="mt-6">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar Billetera
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente tu billetera
                                y todos los datos asociados a ella.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteWallet}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

