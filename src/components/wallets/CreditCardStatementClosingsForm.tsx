'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCreditCardStatementClosing } from '@/actions'
import type { Wallet } from '@/interfaces'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'

const toMonthInput = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const toDateTimeInput = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export const CreditCardStatementClosingsForm = ({ wallet }: { wallet: Wallet }) => {
  const router = useRouter()
  const latestClosing = wallet.statementClosings?.[0]
  const [statementMonth, setStatementMonth] = useState(toMonthInput(latestClosing?.statementMonth))
  const [closingAt, setClosingAt] = useState(toDateTimeInput(latestClosing?.closingAt))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const save = async () => {
    setError(null)
    setIsPending(true)

    try {
      const response = await saveCreditCardStatementClosing({
        walletId: wallet.id,
        statementMonth: `${statementMonth}-01T00:00:00`,
        closingAt,
        note,
      })

      if (!response.ok) {
        setError(response.message)
        return
      }

      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
      <div>
        <p className='text-sm font-semibold text-white'>Cortes reales</p>
        <p className='mt-1 text-xs text-slate-400'>El día de corte estimado se usa solo si un mes no tiene cierre real.</p>
      </div>
      <div className='grid gap-3 md:grid-cols-3'>
        <div className='grid gap-2'>
          <Label>Mes del estado</Label>
          <Input type='month' value={statementMonth} onChange={(event) => setStatementMonth(event.target.value)} />
        </div>
        <div className='grid gap-2'>
          <Label>Fecha real de corte</Label>
          <Input type='datetime-local' step='1' value={closingAt} onChange={(event) => setClosingAt(event.target.value)} />
        </div>
        <div className='grid gap-2'>
          <Label>Nota</Label>
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder='Opcional' />
        </div>
      </div>
      {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
      <Button type='button' variant='outline' onClick={save} disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar corte real'}
      </Button>
      {(wallet.statementClosings?.length ?? 0) > 0 && (
        <div className='grid gap-2'>
          {wallet.statementClosings?.slice(0, 6).map((closing) => (
            <div key={closing.id} className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm'>
              <span className='text-slate-300'>{new Date(closing.statementMonth).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
              <span className='text-white'>{new Date(closing.closingAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
