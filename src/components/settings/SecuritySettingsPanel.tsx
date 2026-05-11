'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword, deleteAccount, logout } from '@/actions'
import { Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input, Label } from '@/components/ui'

interface SecuritySettingsPanelProps {
  email: string
  hasPassword: boolean
  hasGoogle: boolean
}

export const SecuritySettingsPanel = ({ email, hasPassword, hasGoogle }: SecuritySettingsPanelProps) => {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPasswordPending, setIsPasswordPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  const accessLabel = hasPassword && hasGoogle ? 'Correo y Google' : hasGoogle ? 'Google' : 'Correo'

  const submitPassword = async () => {
    setPasswordError(null)
    setPasswordMessage(null)
    setIsPasswordPending(true)

    try {
      const response = await changePassword({ currentPassword, newPassword })
      if (!response.ok) {
        setPasswordError(response.message)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage(response.message || 'Contraseña actualizada')
    } finally {
      setIsPasswordPending(false)
    }
  }

  const submitLogout = async () => {
    await logout()
    window.location.replace('/auth/login')
  }

  const submitDelete = async () => {
    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const response = await deleteAccount({
        emailConfirmation: deleteEmail,
        currentPassword: deletePassword,
      })

      if (response && !response.ok) {
        setDeleteError(response.message)
        return
      }

      router.replace('/auth/register')
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <div className='grid gap-4'>
      <section className='glass-panel rounded-[1.75rem] p-5'>
        <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Acceso</p>
        <h2 className='mt-2 text-lg font-semibold text-white'>{accessLabel}</h2>
        <p className='mt-1 text-sm text-slate-400'>{email}</p>
        <div className='mt-4 grid gap-2 text-sm text-slate-300'>
          <p>Correo: {hasPassword ? 'activo' : 'sin contraseña'}</p>
          <p>Google: {hasGoogle ? 'vinculado' : 'no vinculado'}</p>
        </div>
        <Button variant='outline' className='mt-4 w-full' onClick={submitLogout}>
          Cerrar sesión
        </Button>
      </section>

      {hasPassword && (
        <section className='glass-panel rounded-[1.75rem] p-5'>
          <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Contraseña</p>
          <h2 className='mt-2 text-lg font-semibold text-white'>Cambiar contraseña</h2>
          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label>Contraseña actual</Label>
              <Input type='password' value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete='current-password' />
            </div>
            <div className='grid gap-2'>
              <Label>Nueva contraseña</Label>
              <Input type='password' value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete='new-password' />
            </div>
            {passwordError && <Alert variant='destructive'><AlertDescription>{passwordError}</AlertDescription></Alert>}
            {passwordMessage && <Alert><AlertDescription>{passwordMessage}</AlertDescription></Alert>}
            <Button onClick={submitPassword} disabled={isPasswordPending || currentPassword.length < 6 || newPassword.length < 6}>
              {isPasswordPending ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
          </div>
        </section>
      )}

      <section className='rounded-[1.75rem] border border-red-400/30 bg-red-500/10 p-5'>
        <p className='text-xs uppercase tracking-[0.24em] text-red-200/70'>Zona peligrosa</p>
        <h2 className='mt-2 text-lg font-semibold text-red-100'>Eliminar cuenta</h2>
        <p className='mt-1 text-sm text-red-100/70'>Esta acción elimina tus datos financieros y no se puede deshacer.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' className='mt-4 w-full'>Eliminar cuenta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar cuenta</AlertDialogTitle>
              <AlertDialogDescription>
                Escribe tu correo exacto{hasPassword ? ' y tu contraseña actual' : ''} para confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label>Correo</Label>
                <Input value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} placeholder={email} />
              </div>
              {hasPassword && (
                <div className='grid gap-2'>
                  <Label>Contraseña actual</Label>
                  <Input type='password' value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
                </div>
              )}
              {deleteError && <Alert variant='destructive'><AlertDescription>{deleteError}</AlertDescription></Alert>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className='bg-red-600 text-white hover:bg-red-700'
                disabled={isDeletePending || deleteEmail.trim().toLowerCase() !== email.toLowerCase() || (hasPassword && deletePassword.length < 6)}
                onClick={(event) => {
                  event.preventDefault()
                  void submitDelete()
                }}
              >
                {isDeletePending ? 'Eliminando...' : 'Eliminar definitivamente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
