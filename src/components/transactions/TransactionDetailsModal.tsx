import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import type { Category, Transaction, Wallet } from "@/interfaces"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { getAmountColor } from '@/utils'
import { TransactionActions } from './TransactionActions'

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
    wallets: Wallet[]
    onEdit?: (transaction: Transaction) => void
    onDelete?: (transaction: Transaction) => void | Promise<void>
}

const relationLabel = (transaction: Transaction) => {
    if (transaction.scheduledOccurrenceId) return 'Pago programado'
    if (transaction.installmentOccurrenceId) return 'Cuota'
    if (transaction.debtId) return 'Deuda'
    return null
}

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
    </div>
)

export const TransactionDetailsModal = ({ isOpen, onClose, transaction, categories, wallets, onEdit, onDelete }: TransactionDetailsModalProps) => {
    if (!transaction) return null

    const categoryName = categories.find( c => c.id === transaction.categoryId )?.name ?? 'Sin categoría'
    const walletName = wallets.find((wallet) => wallet.id === transaction.walletId)?.name ?? 'Cuenta no disponible'
    const fromWalletName = wallets.find((wallet) => wallet.id === transaction.fromWalletId)?.name
    const toWalletName = wallets.find((wallet) => wallet.id === transaction.toWalletId)?.name
    const relation = relationLabel(transaction)

    return (
        <Dialog open={ isOpen } onOpenChange={(open) => {
            if (!open) onClose()
        }}>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="pr-8 text-2xl">{ transaction.title }</DialogTitle>
                    <DialogDescription>
                        {transactionTypeLabel[transaction.type]} · {categoryName}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-sky-400/12 via-white/[0.04] to-transparent p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Monto</p>
                    <div className={`mt-2 text-3xl font-bold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-300' : getAmountColor( transaction.amount )}`}>
                            <CurrencyDisplay
                                amount={ Math.abs(transaction.amount) }
                                showDecimals={ true }
                            />
                    </div>
                    {relation && <span className="mt-3 inline-flex rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">{relation}</span>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Ocurrió" value={format(parseISO( transaction.occurredAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })} />
                    <DetailRow label="Registrado" value={format(parseISO( transaction.recordedAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })} />
                    <DetailRow label="Cuenta" value={walletName} />
                    <DetailRow label="Categoría" value={categoryName} />
                    {(transaction.tags?.length ?? 0) > 0 && (
                        <div className="sm:col-span-2">
                            <DetailRow
                                label="Tags"
                                value={(
                                    <div className="flex flex-wrap gap-2">
                                        {transaction.tags?.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white"
                                                style={{ backgroundColor: tag.color || '#334155' }}
                                            >
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>
                    )}
                    {transaction.fromWalletId && transaction.toWalletId && (
                        <>
                            <DetailRow label="Origen" value={fromWalletName ?? 'Cuenta no disponible'} />
                            <DetailRow label="Destino" value={toWalletName ?? 'Cuenta no disponible'} />
                        </>
                    )}
                    {transaction.description && (
                        <div className="sm:col-span-2">
                            <DetailRow label="Descripción" value={transaction.description} />
                        </div>
                    )}
                </div>

                <DialogFooter className="items-center gap-2 sm:justify-between sm:space-x-0">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {onEdit && onDelete && (
                        <TransactionActions
                            onEdit={() => onEdit(transaction)}
                            onDelete={() => onDelete(transaction)}
                        />
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

