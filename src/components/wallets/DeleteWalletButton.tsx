'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
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
import { deleteWalletById } from '@/actions'
import { useRouter } from 'next/navigation'

interface DeleteWalletButtonProps {
    walletId: string
    walletName?: string
    walletType?: string
}

export function DeleteWalletButton({ walletId, walletName, walletType }: DeleteWalletButtonProps) {

    const router = useRouter()
    const isCreditCard = walletType === 'Tarjeta de Crédito'

    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onDelete = async (id: string) => {
        const response = await deleteWalletById( id )
        if (!response.ok) {
            setError(response.message)
            return
        }
        setOpen(false)
        router.push('/billeteras')
        router.refresh()
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation()
                        setOpen(true)
                    }}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isCreditCard ? 'Archivar tarjeta' : 'Eliminar Billetera'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">
                        {isCreditCard ? `¿Archivar ${walletName ?? 'esta tarjeta'}?` : '¿Estás seguro?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm sm:text-base">
                        {isCreditCard
                            ? 'La tarjeta dejará de aparecer como cuenta activa y sus cuotas pendientes se cancelarán en Planeación. Los movimientos históricos se conservan.'
                            : 'Esta acción no se puede deshacer. Esto eliminará permanentemente la billetera si no tiene historial asociado.'
                        }
                    </AlertDialogDescription>
                    {error && <p className='text-sm text-red-400'>{error}</p>}
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onDelete( walletId )}
                        className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                    >
                        {isCreditCard ? 'Archivar tarjeta' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

