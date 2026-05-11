'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { loginWithGoogle } from '@/actions'
import { AppLogoMark } from '@/components/AppLogoMark'

export const GoogleIcon = () => (
  <svg aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24'>
    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' />
    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z' />
  </svg>
)

export const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) => (
  <Card className='mx-auto w-full max-w-[23rem] overflow-hidden rounded-[1.75rem] border-white/10 bg-slate-950/62 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur-2xl'>
    <CardHeader className='items-center px-5 pb-3 pt-6 text-center'>
      <AppLogoMark className='mb-3 h-14 w-14 rounded-[1.25rem]' />
      <CardTitle className='text-2xl text-white'>{title}</CardTitle>
      <p className='max-w-xs text-sm leading-5 text-slate-400'>{subtitle}</p>
    </CardHeader>
    <CardContent className='space-y-4 px-5 pb-6 pt-0'>
      {children}
      {footer && <div className='text-center text-sm text-slate-300'>{footer}</div>}
    </CardContent>
  </Card>
)

export const AuthDivider = () => (
  <div className='flex items-center gap-3 py-1'>
    <div className='h-px flex-1 bg-white/10' />
    <span className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>o</span>
    <div className='h-px flex-1 bg-white/10' />
  </div>
)

export const GoogleButton = ({ label = 'Continuar con Google' }: { label?: string }) => (
  <form action={loginWithGoogle}>
    <Button
      type='submit'
      variant='outline'
      className='h-12 w-full justify-center border-white/15 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950'
    >
      <GoogleIcon />
      {label}
    </Button>
  </form>
)

export const EmailButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button type='button' variant='outline' className='h-12 w-full justify-center' onClick={onClick}>
    <Mail className='h-5 w-5' />
    {label}
  </Button>
)

export const BackToOptionsButton = ({ onClick }: { onClick: () => void }) => (
  <Button type='button' variant='ghost' size='sm' className='px-0 text-slate-400 hover:text-white' onClick={onClick}>
    <ArrowLeft className='h-4 w-4' />
    Volver
  </Button>
)
