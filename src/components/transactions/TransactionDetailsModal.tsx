import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Transaction } from "@/interfaces"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { getAmountColor } from '@/utils'

const transactionTypeLabel: Record<Transaction['type'], string> = {
    INGRESO: 'Ingreso',
    GASTO: 'Gasto',
    TRANSPORTE: 'Transporte',
    TRANSFERENCIA: 'Transferencia',
    TARJETA_CONSUMO: 'Consumo con tarjeta',
    PAGO_TARJETA: 'Pago de tarjeta',
    DEUDA_PRESTAMO: 'Deuda / préstamo',
    DEUDA_ABONO: 'Abono a deuda',
}

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
                        <span className="font-bold">Tipo:</span>
                        <span className="col-span-2">{transactionTypeLabel[transaction.type]}</span>
                    </div>
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
                        <span className="font-bold">Ocurrió:</span>
                        <span className="col-span-2">
                            {format(parseISO( transaction.occurredAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Registrada:</span>
                        <span className="col-span-2">
                            {format(parseISO( transaction.recordedAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Categoría:</span>
                        <span className="col-span-2">{ categories.find( c => c.id === transaction.categoryId )?.name ?? 'Sin categoría' }</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-bold">Cuenta base:</span>
                        <span className="col-span-2">{ transaction.walletId }</span>
                    </div>
                    {transaction.fromWalletId && transaction.toWalletId && (
                        <>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-bold">Origen:</span>
                                <span className="col-span-2">{ transaction.fromWalletId }</span>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-bold">Destino:</span>
                                <span className="col-span-2">{ transaction.toWalletId }</span>
                            </div>
                        </>
                    )}
                    <div className="grid grid-cols-3 items-start gap-4">
                        <span className="font-bold">Descripción:</span>
                        <span className="col-span-2">{ transaction.description }</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

