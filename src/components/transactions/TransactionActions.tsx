import { Pencil, Trash2 } from 'lucide-react'
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

interface TransactionActionsProps {
    onEdit: (e: React.MouseEvent) => void
    onDelete: (e: React.MouseEvent) => void
}

export function TransactionActions({ onEdit, onDelete }: TransactionActionsProps) {
    return (
        <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base">
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la transacción.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="w-full sm:w-auto">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

