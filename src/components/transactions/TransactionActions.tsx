'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui'


interface TransactionActionsProps {
    onEdit: () => void
    onDelete: () => void | Promise<void>
}

export const TransactionActions = ({ onEdit, onDelete }: TransactionActionsProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDelete()
            setIsOpen(false)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={(event) => {
                event.stopPropagation()
                onEdit()
            }}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <Button variant="outline" size="icon" onClick={(event) => {
                    event.stopPropagation()
                    setIsOpen(true)
                }}>
                    <Trash2 className="h-4 w-4 text-rose-300" />
                </Button>
                <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar movimiento</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. El saldo asociado se revertirá según el tipo de movimiento.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

