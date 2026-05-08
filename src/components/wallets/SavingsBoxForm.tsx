'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Wallet } from '@/interfaces'
import { createSavingsBox } from '@/actions'
import { Alert, AlertDescription, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'

const suggestedColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b']

export const SavingsBoxForm = ({ wallets }: { wallets: Wallet[] }) => {
  const router = useRouter()
  const parentWallets = wallets.filter((wallet) => wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte')
  const [open, setOpen] = useState(false)
  const [parentWalletId, setParentWalletId] = useState(parentWallets[0]?.id ?? '')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('0')
  const [color, setColor] = useState('#0ea5e9')
  const [includeInTotal, setIncludeInTotal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
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
      <Button type='button' variant='outline' disabled={parentWallets.length === 0} onClick={() => setOpen(true)}>
        Crear cajita
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cajita</DialogTitle>
          <DialogDescription>Se crea dentro de una cuenta y el saldo inicial se mueve desde esa cuenta.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>Cuenta padre</Label>
            <Select value={parentWalletId} onValueChange={setParentWalletId}>
              <SelectTrigger><SelectValue placeholder='Elige una cuenta' /></SelectTrigger>
              <SelectContent>
                {parentWallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label>Nombre</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder='Ej. Viaje, impuestos, colchón' />
          </div>
          <div className='grid gap-2'>
            <Label>Saldo inicial</Label>
            <Input type='number' step='0.01' min='0' value={balance} onChange={(event) => setBalance(event.target.value)} />
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
            <span>Sumar esta cajita al disponible del período</span>
          </label>
          {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!parentWalletId || !name.trim() || isPending}>{isPending ? 'Creando...' : 'Crear cajita'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
