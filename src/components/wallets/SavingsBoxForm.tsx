'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Wallet } from '@/interfaces'
import { createSavingsBox } from '@/actions'
import { Alert, AlertDescription, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

const suggestedColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b']

interface SavingsBoxFormProps {
  wallets: Wallet[]
  defaultParentWalletId?: string
  trigger?: ReactNode
  hideParentSelector?: boolean
}

export const SavingsBoxForm = ({ wallets, defaultParentWalletId, trigger, hideParentSelector = false }: SavingsBoxFormProps) => {
  const router = useRouter()
  const parentWallets = useMemo(
    () => wallets.filter((wallet) => wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte'),
    [wallets],
  )
  const [open, setOpen] = useState(false)
  const [parentWalletId, setParentWalletId] = useState(defaultParentWalletId ?? parentWallets[0]?.id ?? '')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('0')
  const [color, setColor] = useState('#0ea5e9')
  const [includeInTotal, setIncludeInTotal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const selectedParentWallet = parentWallets.find((wallet) => wallet.id === parentWalletId)
  const initialBalance = Number(balance || 0)
  const balanceExceedsParent = selectedParentWallet ? initialBalance > selectedParentWallet.balance : false

  useEffect(() => {
    if (!open) return
    setParentWalletId(defaultParentWalletId ?? parentWallets[0]?.id ?? '')
    setError(null)
  }, [defaultParentWalletId, open, parentWallets])

  const submit = async () => {
    setError(null)
    if (balanceExceedsParent) {
      setError('El saldo inicial no puede superar el saldo disponible de la cuenta padre.')
      return
    }

    setIsPending(true)
    try {
      const response = await createSavingsBox({
        parentWalletId,
        name,
        balance: Number(balance || 0),
        color,
        includeInTotal,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      setOpen(false)
      setName('')
      setBalance('0')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <button type='button' className='contents' disabled={parentWallets.length === 0} onClick={() => setOpen(true)}>
          {trigger}
        </button>
      ) : (
        <Button type='button' variant='outline' disabled={parentWallets.length === 0} onClick={() => setOpen(true)}>
          Nueva cajita
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cajita</DialogTitle>
          <DialogDescription>Aparta dinero dentro de una cuenta sin perder trazabilidad.</DialogDescription>
        </DialogHeader>
        {parentWallets.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300'>
            Primero crea una cuenta de efectivo, bancaria o de ahorros para poder guardar cajitas dentro de ella.
          </div>
        ) : (
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              {!hideParentSelector && (
                <>
                  <Label>Cuenta donde estará la cajita</Label>
                  <Select value={parentWalletId} onValueChange={setParentWalletId}>
                    <SelectTrigger><SelectValue placeholder='Elige una cuenta' /></SelectTrigger>
                    <SelectContent>
                      {parentWallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
              {selectedParentWallet && (
                <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300'>
                  Disponible {hideParentSelector ? 'en esta cuenta' : `en ${selectedParentWallet.name}`}:{' '}
                  <CurrencyDisplay amount={selectedParentWallet.balance} showDecimals={true} className='inline-block font-semibold text-white' />
                </div>
              )}
            </div>
            <div className='grid gap-2'>
              <Label>Nombre</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder='Ej. Viaje, impuestos, colchón' />
            </div>
            <div className='grid gap-2'>
              <Label>Saldo inicial</Label>
              <Input type='number' step='0.01' min='0' value={balance} onChange={(event) => setBalance(event.target.value)} />
              {balanceExceedsParent && (
                <p className='text-xs text-rose-300'>No puedes mover más dinero del que tiene la cuenta padre.</p>
              )}
            </div>
            <div className='grid gap-2'>
              <Label>Color</Label>
              <div className='flex items-center gap-2'>
                <Input type='color' value={color} onChange={(event) => setColor(event.target.value)} className='h-11 w-14 p-1' />
                <div className='flex flex-wrap gap-2'>
                  {suggestedColors.map((item) => (
                    <button key={item} type='button' className='h-7 w-7 rounded-full border border-white/20' style={{ backgroundColor: item }} onClick={() => setColor(item)} />
                  ))}
                </div>
              </div>
            </div>
            <label className='flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300'>
              <Checkbox checked={includeInTotal} onCheckedChange={(value) => setIncludeInTotal(Boolean(value))} />
              <span>
                <span className='block font-medium text-white'>Sumar al disponible</span>
                <span className='text-xs text-slate-400'>Si lo activas, esta cajita cuenta como dinero usable. Si lo dejas apagado, queda apartada.</span>
              </span>
            </label>
            {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={parentWallets.length === 0 || !parentWalletId || !name.trim() || balanceExceedsParent || isPending}>{isPending ? 'Creando...' : 'Crear cajita'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
