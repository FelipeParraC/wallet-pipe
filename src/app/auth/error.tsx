'use client'

import { RouteErrorState } from '@/components'

export default function AuthError({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <RouteErrorState
      title='No pudimos cargar el acceso'
      description='Hubo un problema preparando la pantalla de autenticación. Inténtalo otra vez.'
      onRetry={reset}
    />
  )
}
