'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { moveSavingsBoxMoney } from '@/actions'
import type { Wallet } from '@/interfaces'
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/components/ui'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

interface SavingsBoxMoneyDialogProps {
  savingsBox: Wallet
  parentWallet: Wallet
  direction: 'ADD' | 'WITHDRAW'
  trigger: ReactNode
}

export const SavingsBoxMoneyDialog = ({ savingsBox, parentWallet, direction, trigger }: SavingsBoxMoneyDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isAdding = direction === 'ADD'
  const maxAmount = isAdding ? parentWallet.balance : savingsBox.balance
  const numericAmount = Number(amount || 0)
  const exceedsBalance = numericAmount > maxAmount

  const submit = async () => {
    setError(null)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Ingresa un monto mayor a 0.')
      return
    }

    if (exceedsBalance) {
      setError(isAdding ? 'No puedes agregar más de lo disponible en la cuenta padre.' : 'No puedes sacar más de lo disponible en la cajita.')
      return
    }

    setIsPending(true)
    try {
      const response = await moveSavingsBoxMoney({
        savingsBoxId: savingsBox.id,
        direction,
        amount: numericAmount,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      setAmount('')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type='button' className='contents' onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAdding ? 'Agregar dinero' : 'Sacar dinero'}</DialogTitle>
          <DialogDescription>
            {isAdding ? `Desde ${parentWallet.name} hacia ${savingsBox.name}.` : `Desde ${savingsBox.name} hacia ${parentWallet.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300'>
            Disponible para mover:{' '}
            <CurrencyDisplay amount={maxAmount} showDecimals={true} className='inline-block font-semibold text-white' />
          </div>
          <div className='grid gap-2'>
            <Label>Monto</Label>
            <Input type='number' step='0.01' min='0' value={amount} onChange={(event) => setAmount(event.target.value)} />
            {exceedsBalance && (
              <p className='text-xs text-rose-300'>
                {isAdding ? 'La cuenta padre no tiene ese saldo disponible.' : 'La cajita no tiene ese saldo disponible.'}
              </p>
            )}
          </div>
          {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={isPending || !numericAmount || exceedsBalance}>
            {isPending ? 'Moviendo...' : isAdding ? 'Agregar' : 'Sacar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
