'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'

interface ProfileSettingsFormProps {
  name: string
  nickname: string
}

export const ProfileSettingsForm = ({ name, nickname }: ProfileSettingsFormProps) => {
  const router = useRouter()
  const [nextName, setNextName] = useState(name)
  const [nextNickname, setNextNickname] = useState(nickname)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    setMessage(null)
    setError(null)
    setIsPending(true)

    try {
      const response = await updateProfile({ name: nextName, nickname: nextNickname })
      if (!response.ok) {
        setError(response.message)
        return
      }

      setMessage(response.message || 'Perfil actualizado')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className='grid gap-4'>
      <div className='grid gap-2'>
        <Label>Nombre</Label>
        <Input value={nextName} onChange={(event) => setNextName(event.target.value)} />
      </div>
      <div className='grid gap-2'>
        <Label>Apodo</Label>
        <Input value={nextNickname} onChange={(event) => setNextNickname(event.target.value)} />
      </div>
      {error && <Alert variant='destructive'><AlertDescription>{error}</AlertDescription></Alert>}
      {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
      <Button onClick={submit} disabled={isPending || nextName.trim().length < 2 || nextNickname.trim().length < 2}>
        {isPending ? 'Guardando...' : 'Guardar perfil'}
      </Button>
    </div>
  )
}
