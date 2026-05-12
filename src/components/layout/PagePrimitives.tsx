import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'

export const PageStack = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full space-y-5 ${className}`}>
    {children}
  </div>
)

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) => (
  <section className='glass-panel rounded-[2rem] p-5 text-left sm:p-6'>
    {eyebrow && <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>{eyebrow}</p>}
    <div className='mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div className='min-w-0'>
        <h1 className='text-2xl font-semibold leading-tight text-white md:text-3xl'>{title}</h1>
        {description && <div className='mt-1 text-sm leading-6 text-slate-400'>{description}</div>}
      </div>
      {actions && <div className='shrink-0'>{actions}</div>}
    </div>
  </section>
)

export const SummaryPanel = ({
  eyebrow,
  title,
  children,
  className = '',
}: {
  eyebrow?: string
  title?: string
  children: ReactNode
  className?: string
}) => (
  <section className={`overflow-hidden rounded-[1.75rem] border border-sky-200/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0.8)_48%,rgba(2,6,23,0.94))] p-5 ${className}`}>
    {eyebrow && <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>{eyebrow}</p>}
    {title && <h2 className='mt-2 text-lg font-semibold text-white'>{title}</h2>}
    <div className={eyebrow || title ? 'mt-3' : ''}>{children}</div>
  </section>
)

export const EmptyState = ({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) => (
  <section className='glass-panel rounded-[1.75rem] border border-dashed border-white/10 p-6 text-center sm:p-8'>
    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.05] text-slate-300'>
      {icon ?? <Inbox className='h-5 w-5' />}
    </div>
    <h2 className='mt-4 text-lg font-semibold text-white'>{title}</h2>
    {description && <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400'>{description}</p>}
    {action && <div className='mt-5'>{action}</div>}
  </section>
)

export const DataState = ({
  title,
  description,
}: {
  title: string
  description?: ReactNode
}) => (
  <section className='glass-panel rounded-[1.75rem] border border-dashed border-amber-200/20 p-6 text-center sm:p-8'>
    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-amber-200/20 bg-amber-400/10 text-amber-100'>
      <AlertTriangle className='h-5 w-5' />
    </div>
    <h2 className='mt-4 text-lg font-semibold text-white'>{title}</h2>
    {description && <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400'>{description}</p>}
  </section>
)
