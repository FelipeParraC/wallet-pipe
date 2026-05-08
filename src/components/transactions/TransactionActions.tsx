import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui'

interface TransactionActionsProps {
    onEdit: () => void
    onDelete: () => void
}

export const TransactionActions = ({ onEdit, onDelete }: TransactionActionsProps) => {
    return (
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={(event) => {
                event.stopPropagation()
                onEdit()
            }}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={(event) => {
                event.stopPropagation()
                onDelete()
            }}>
                <Trash2 className="h-4 w-4 text-rose-300" />
            </Button>
        </div>
    )
}

