'use client'

import { AlertTriangle, Trash2 } from 'lucide-react'
import type { Transaction } from '@/interfaces'
import { getTransactionTypeLabel } from '@/utils'
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

interface DeleteTransactionDialogProps {
    transaction: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (transaction: Transaction) => Promise<{ ok: boolean; message: string }>
    isDeleting?: boolean
    error?: string | null
}

const deleteImpact = (transaction: Transaction) => {
    if (transaction.type === 'TARJETA_DEVOLUCION') return 'Se revertirá la devolución: aumentará la deuda de la tarjeta y, si era una compra a cuotas, se reabrirán las cuotas pendientes.'
    if (transaction.installmentPlanId) return 'Esta compra a cuotas intentará eliminar también su plan asociado. Si ya existen pagos reales vinculados, el servidor puede bloquearlo para proteger la contabilidad.'
    if (transaction.installmentOccurrenceId) return 'La cuota vinculada volverá a quedar pendiente y el plan de cuotas se recalculará.'
    if (transaction.scheduledOccurrenceId) return 'El pago programado volverá a quedar pendiente para este ciclo.'
    if (transaction.debtId) return 'El saldo de la deuda se ajustará para revertir este abono.'
    if (transaction.type === 'PAGO_TARJETA') return 'Se devolverá el dinero a la cuenta origen y aumentará nuevamente la deuda de la tarjeta.'
    if (transaction.type === 'TARJETA_CONSUMO') return 'Se reducirá la deuda de la tarjeta y se restaurará el cupo disponible.'
    if (transaction.type === 'TRANSFERENCIA') return 'Se revertirá el movimiento entre cuentas.'
    return 'Se revertirá el saldo de la cuenta asociada.'
}

export const DeleteTransactionDialog = ({
    transaction,
    open,
    onOpenChange,
    onConfirm,
    isDeleting = false,
    error,
}: DeleteTransactionDialogProps) => {
    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                    <div className='mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/12 text-rose-100'>
                        <AlertTriangle className='h-5 w-5' />
                    </div>
                    <DialogTitle>Eliminar movimiento</DialogTitle>
                    <DialogDescription>
                        Esta acción ajusta saldos y relaciones contables. Revísalo con calma antes de continuar.
                    </DialogDescription>
                </DialogHeader>

                <div className='grid gap-3'>
                    <div className='rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4'>
                        <div className='flex items-start justify-between gap-4'>
                            <div className='min-w-0'>
                                <p className='truncate font-semibold text-white'>{transaction.title}</p>
                                <p className='mt-1 text-sm text-slate-400'>{getTransactionTypeLabel(transaction.type)}</p>
                            </div>
                            <CurrencyDisplay amount={Math.abs(transaction.amount)} showDecimals={true} className='shrink-0 font-bold text-white' />
                        </div>
                    </div>

                    <div className='rounded-[1.35rem] border border-rose-300/15 bg-rose-400/10 p-4 text-sm text-rose-100'>
                        <Trash2 className='mr-2 inline h-4 w-4' />
                        {deleteImpact(transaction)}
                    </div>

                    {error && (
                        <Alert variant='destructive'>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancelar</Button>
                    <Button variant='destructive' onClick={() => onConfirm(transaction)} disabled={isDeleting}>
                        <Trash2 className='h-4 w-4' />
                        {isDeleting ? 'Eliminando...' : 'Eliminar movimiento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
