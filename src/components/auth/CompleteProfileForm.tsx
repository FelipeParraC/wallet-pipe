'use client'

import { useState } from 'react'
import { completeProfile } from '@/actions'
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'

export const CompleteProfileForm = ({ defaultName }: { defaultName?: string | null }) => {
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
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Completa tu perfil</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300'>
          {defaultName ? `${defaultName}, elige cómo quieres que te llamemos en Wallet Pipe.` : 'Elige cómo quieres que te llamemos en Wallet Pipe.'}
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
      </CardContent>
    </Card>
  )
}
