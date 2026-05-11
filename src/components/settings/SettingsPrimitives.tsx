import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'

interface SettingsPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
}

export const SettingsPageHeader = ({ eyebrow = 'Ajustes', title, description }: SettingsPageHeaderProps) => (
  <section className='glass-panel rounded-[1.75rem] p-5 sm:p-6'>
    <Link href='/configuracion' className='mb-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200'>
      <ArrowLeft className='h-4 w-4' />
      Volver a Ajustes
    </Link>
    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>{eyebrow}</p>
    <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>{title}</h1>
    {description && <p className='mt-2 max-w-2xl text-sm text-slate-400'>{description}</p>}
  </section>
)

interface SettingsOptionCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  meta?: string
  tone?: string
}

export const SettingsOptionCard = ({ href, icon, title, description, meta, tone = 'text-sky-200 bg-sky-400/12 border-sky-200/15' }: SettingsOptionCardProps) => (
  <Link
    href={href}
    className='group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-sky-200/25 hover:bg-white/[0.07]'
  >
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
      {icon}
    </span>
    <span className='min-w-0 flex-1'>
      <span className='flex items-center justify-between gap-3'>
        <span className='truncate font-semibold text-white'>{title}</span>
        {meta && <span className='shrink-0 text-xs font-medium text-slate-400'>{meta}</span>}
      </span>
      <span className='mt-1 line-clamp-2 text-sm text-slate-400'>{description}</span>
    </span>
    <ChevronRight className='h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-200' />
  </Link>
)

export const SettingsInfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
    <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>{label}</p>
    <p className='mt-2 font-medium text-white'>{value}</p>
  </div>
)
