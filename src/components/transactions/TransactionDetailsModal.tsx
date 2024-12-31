import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Transaction } from "@/interfaces"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { getAmountColor } from '@/utils'

interface TransactionDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    transaction: Transaction | null
    categories: Category[]
}

export const TransactionDetailsModal = ({ isOpen, onClose, transaction, categories }: TransactionDetailsModalProps) => {
    if (!transaction) return null

    return (
        <Dialog open={ isOpen } onOpenChange={ onClose }>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{ transaction.title }</DialogTitle>
                    <DialogDescription>Detalles de la transacción</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Monto:</span>
                        <span className={`col-span-2 text-lg font-semibold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-400' : getAmountColor( transaction.amount )}`}>
                            <CurrencyDisplay
                                amount={ Math.abs(transaction.amount) }
                                showDecimals={ true }
                            />
                        </span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Fecha:</span>
                        <span className="col-span-2">
                            {format(parseISO( transaction.date ), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Categoría:</span>
                        <span className="col-span-2">{ categories.find( c => c.id === transaction.categoryId )?.name }</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Billetera:</span>
                        <span className="col-span-2">{ transaction.walletId }</span>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-4">
                        <span className="font-bold">Descripción:</span>
                        <span className="col-span-2">{ transaction.description }</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

