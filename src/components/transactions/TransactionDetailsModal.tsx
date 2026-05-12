import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import type { Category, Transaction, Wallet } from "@/interfaces"
import { ArrowRightLeft, CalendarClock, CreditCard, ReceiptText, Tags, WalletCards } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { getAmountColor, getTransactionTypeLabel } from '@/utils'
import { TransactionActions } from './TransactionActions'
import { isSavingsBoxInternalTransfer } from '@/lib/savings-box'

interface TransactionDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    transaction: Transaction | null
    categories: Category[]
    wallets: Wallet[]
    onEdit?: (transaction: Transaction) => void
    onDelete?: (transaction: Transaction) => void
}

const relationLabel = (transaction: Transaction, wallets: Wallet[]) => {
    if (isSavingsBoxInternalTransfer(transaction, wallets)) return 'Movimiento interno'
    if (transaction.scheduledOccurrenceId) return 'Pago programado'
    if (transaction.installmentOccurrenceId) return 'Cuota de tarjeta'
    if (transaction.type === 'TARJETA_DEVOLUCION' && transaction.installmentPlanId) return 'Devolución de compra a cuotas'
    if (transaction.installmentPlanId) return 'Compra a cuotas'
    if (transaction.debtId) return 'Deuda'
    if (transaction.type === 'TARJETA_DEVOLUCION') return 'Devolución de tarjeta'
    if (transaction.type === 'PAGO_TARJETA') return 'Pago de tarjeta'
    return null
}

const impactLabel = (transaction: Transaction, wallets: Wallet[]) => {
    if (transaction.type === 'INGRESO') return 'Aumenta el saldo de la cuenta.'
    if (transaction.type === 'GASTO') return 'Reduce el saldo de la cuenta.'
    if (transaction.type === 'TRANSPORTE') return 'Reduce el saldo de transporte.'
    if (isSavingsBoxInternalTransfer(transaction, wallets)) return 'Mueve dinero dentro de la cuenta padre y su cajita.'
    if (transaction.type === 'TRANSFERENCIA') return 'Mueve dinero entre cuentas propias.'
    if (transaction.type === 'TARJETA_CONSUMO') return 'Aumenta la deuda de la tarjeta y reduce el cupo.'
    if (transaction.type === 'TARJETA_DEVOLUCION') return 'Reduce la deuda de la tarjeta y libera cupo.'
    if (transaction.type === 'PAGO_TARJETA') return 'Reduce saldo de la cuenta origen y deuda de la tarjeta.'
    if (transaction.type === 'DEUDA_ABONO') return 'Actualiza el saldo pendiente de una deuda.'
    return 'Movimiento financiero registrado.'
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
    const relation = relationLabel(transaction, wallets)
    const isInternalSavingsBoxMovement = isSavingsBoxInternalTransfer(transaction, wallets)
    const isTransfer = Boolean(transaction.fromWalletId && transaction.toWalletId)

    return (
        <Dialog open={ isOpen } onOpenChange={(open) => {
            if (!open) onClose()
        }}>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="pr-8 text-2xl">{ transaction.title }</DialogTitle>
                    <DialogDescription>
                        {isInternalSavingsBoxMovement ? 'Movimiento interno' : getTransactionTypeLabel(transaction.type)} · {categoryName}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-sky-400/12 via-white/[0.04] to-transparent p-4">
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Impacto</p>
                            <div className={`mt-2 text-3xl font-bold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-300' : getAmountColor( transaction.amount )}`}>
                                    <CurrencyDisplay
                                        amount={ Math.abs(transaction.amount) }
                                        showDecimals={ true }
                                    />
                            </div>
                            <p className='mt-2 text-sm text-slate-400'>{impactLabel(transaction, wallets)}</p>
                        </div>
                        <div className='flex flex-wrap gap-2 sm:justify-end'>
                            <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200'>
                                <ReceiptText className='h-3.5 w-3.5' />
                                {isInternalSavingsBoxMovement ? 'Movimiento interno' : getTransactionTypeLabel(transaction.type)}
                            </span>
                            {relation && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200">
                                    {transaction.type === 'PAGO_TARJETA' || transaction.type === 'TARJETA_CONSUMO' || transaction.type === 'TARJETA_DEVOLUCION' ? <CreditCard className='h-3.5 w-3.5' /> : <WalletCards className='h-3.5 w-3.5' />}
                                    {relation}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Fecha de compra" value={<span className='inline-flex items-center gap-2'><CalendarClock className='h-4 w-4 text-slate-500' />{format(parseISO( transaction.occurredAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}</span>} />
                    <DetailRow label="Registrado en la app" value={<span className='inline-flex items-center gap-2'><CalendarClock className='h-4 w-4 text-slate-500' />{format(parseISO( transaction.recordedAt || transaction.date ), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}</span>} />
                    <DetailRow label="Cuenta" value={walletName} />
                    <DetailRow label="Categoría" value={categoryName} />
                    {(transaction.tags?.length ?? 0) > 0 && (
                        <div className="sm:col-span-2">
                            <DetailRow
                                label="Tags"
                                value={(
                                    <div className="flex flex-wrap gap-2">
                                        <Tags className='mt-1 h-4 w-4 text-slate-500' />
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
                    {isTransfer && (
                        <>
                            <DetailRow label="Origen" value={<span className='inline-flex items-center gap-2'><ArrowRightLeft className='h-4 w-4 text-slate-500' />{fromWalletName ?? 'Cuenta no disponible'}</span>} />
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

