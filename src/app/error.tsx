'use client'

import { RouteErrorState } from '@/components'

export default function RootError({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <RouteErrorState
      title='Wallet Pipe tuvo un problema'
      description='La aplicación no pudo completar esta carga. Si fue una caída temporal, reintentar debería recuperarla.'
      onRetry={reset}
    />
  )
}
