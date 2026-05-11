'use client'

import { useState } from 'react'
import Image from 'next/image'
import { completeProfile } from '@/actions'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'
import { AuthShell } from './AuthPrimitives'

export const CompleteProfileForm = ({ defaultName, image }: { defaultName?: string | null; image?: string | null }) => {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setError(null)
    setIsPending(true)

    try {
      const response = await completeProfile(nickname)
      if (!response.ok) {
        setError(response.message)
        return
      }

      window.location.replace('/')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AuthShell title='Completa tu perfil' subtitle='Elige cómo quieres que te llamemos.'>
      <div className='space-y-4'>
        <div className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
          {image ? (
            <Image src={image} alt={defaultName ?? 'Usuario'} width={44} height={44} className='h-11 w-11 rounded-full' />
          ) : (
            <div className='flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-100'>
              {(defaultName?.[0] ?? 'W').toUpperCase()}
            </div>
          )}
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-white'>{defaultName ?? 'Wallet Pipe'}</p>
            <p className='text-xs text-slate-400'>Tu apodo aparecerá en “Hola, ...”.</p>
          </div>
        </div>
        <div className='grid gap-2'>
          <Label>Apodo</Label>
          <Input autoFocus value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder='Ej. Pipe' />
        </div>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button className='w-full' onClick={submit} disabled={isPending || nickname.trim().length < 2}>
          {isPending ? 'Guardando...' : 'Guardar apodo'}
        </Button>
      </div>
    </AuthShell>
  )
}
