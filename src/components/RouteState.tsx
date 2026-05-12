import Link from 'next/link'
import { AlertTriangle, Loader2, RefreshCcw, WifiOff } from 'lucide-react'
import { Button } from './ui'

interface RouteErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export const RouteErrorState = ({
  title = 'No pudimos mostrar esta pantalla',
  description = 'Puede ser un problema temporal de conexión. Inténtalo de nuevo en un momento.',
  onRetry,
}: RouteErrorStateProps) => (
  <div className='mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-3'>
    <section className='glass-panel w-full rounded-[2rem] p-6 text-center sm:p-8'>
      <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-rose-200/20 bg-rose-400/12 text-rose-100'>
        <AlertTriangle className='h-6 w-6' />
      </div>
      <h1 className='mt-5 text-xl font-semibold text-white sm:text-2xl'>{title}</h1>
      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400'>{description}</p>
      <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
        {onRetry && (
          <Button type='button' onClick={onRetry}>
            <RefreshCcw className='h-4 w-4' />
            Reintentar
          </Button>
        )}
        <Button variant='outline' asChild>
          <Link href='/'>Ir al inicio</Link>
        </Button>
      </div>
    </section>
  </div>
)

export const RouteLoadingState = ({ title = 'Cargando Wallet Pipe' }: { title?: string }) => (
  <div className='mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-3'>
    <section className='glass-panel w-full rounded-[2rem] p-6 text-center sm:p-8'>
      <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-sky-200/20 bg-sky-400/12 text-sky-100'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
      <h1 className='mt-5 text-xl font-semibold text-white sm:text-2xl'>{title}</h1>
      <p className='mt-2 text-sm text-slate-400'>Preparando tus datos.</p>
    </section>
  </div>
)

export const DataUnavailableNotice = ({ message }: { message?: string }) => (
  <div className='rounded-[1.5rem] border border-amber-200/20 bg-amber-400/10 p-4 text-sm text-amber-50'>
    <div className='flex gap-3'>
      <WifiOff className='mt-0.5 h-4 w-4 shrink-0' />
      <div>
        <p className='font-semibold'>Datos temporalmente incompletos</p>
        <p className='mt-1 leading-5 text-amber-50/78'>
          {message || 'No pudimos conectar con todos los datos. Revisa de nuevo en unos segundos.'}
        </p>
      </div>
    </div>
  </div>
)
