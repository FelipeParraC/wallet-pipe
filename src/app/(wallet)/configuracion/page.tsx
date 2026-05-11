export const revalidate = 0

import { AppWindow, CalendarClock, ChevronRight, CreditCard, FolderTree, KeyRound, Landmark, LayoutList, Tags, UserRound, Wallet } from 'lucide-react'
import { auth } from '@/auth.config'
import { getCurrentCycleSummary, getCycleSettings, getSettingsOverview } from '@/actions'
import { SettingsOptionCard } from '@/components'
import { formatCurrency } from '@/utils'

export default async function ConfiguracionPage() {
  const session = await auth()
  const [cycleSettingsResponse, cycleSummaryResponse, settingsOverviewResponse] = await Promise.all([
    getCycleSettings(),
    getCurrentCycleSummary(),
    getSettingsOverview(),
  ])

  const cycleSettings = cycleSettingsResponse.ok && cycleSettingsResponse.data ? cycleSettingsResponse.data.cycleSettings : null
  const currentCycle = cycleSummaryResponse.ok && cycleSummaryResponse.data ? cycleSummaryResponse.data.currentCycle : null
  const overview = settingsOverviewResponse.ok && settingsOverviewResponse.data ? settingsOverviewResponse.data : null
  const wallets = overview?.wallets ?? []
  const accounts = wallets.filter((wallet) => wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito')
  const cards = wallets.filter((wallet) => wallet.isActive && wallet.type === 'Tarjeta de Crédito')
  const activeDebts = overview?.debts.filter((debt) => debt.status === 'ACTIVA') ?? []
  const activeScheduled = overview?.scheduledPlans.filter((plan) => plan.isActive) ?? []
  const activeInstallments = overview?.installmentPlans.filter((plan) => plan.isActive) ?? []
  const totalAccounts = accounts.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalCardDebt = cards.reduce((sum, card) => sum + Math.max(card.balance, 0), 0)

  const sections = [
    {
      href: '/configuracion/perfil',
      icon: <UserRound className='h-5 w-5' />,
      title: 'Perfil',
      description: `${session?.user.name ?? 'Usuario'} · ${session?.user.email ?? ''}`,
      meta: session?.user.nickname ?? 'Apodo',
    },
    {
      href: '/configuracion/ciclo',
      icon: <CalendarClock className='h-5 w-5' />,
      title: 'Ciclo financiero',
      description: currentCycle?.label ?? 'Configura cómo se calcula tu ciclo',
      meta: cycleSettings ? `Día ${cycleSettings.defaultStartDay}` : 'Pendiente',
    },
    {
      href: '/configuracion/categorias',
      icon: <FolderTree className='h-5 w-5' />,
      title: 'Categorías',
      description: 'Organiza ingresos, gastos y planeación',
      meta: `${overview?.categories.length ?? 0}`,
    },
    {
      href: '/configuracion/tags',
      icon: <Tags className='h-5 w-5' />,
      title: 'Tags',
      description: 'Etiquetas rápidas para buscar y auditar',
      meta: `${overview?.tags.length ?? 0}`,
    },
    {
      href: '/configuracion/cuentas',
      icon: <Wallet className='h-5 w-5' />,
      title: 'Cuentas',
      description: `${accounts.length} activas · ${formatCurrency(totalAccounts)}`,
      meta: 'Ver',
    },
    {
      href: '/configuracion/tarjetas',
      icon: <CreditCard className='h-5 w-5' />,
      title: 'Tarjetas',
      description: `${cards.length} activas · deuda ${formatCurrency(totalCardDebt)}`,
      meta: 'Ver',
    },
    {
      href: '/configuracion/planeacion',
      icon: <LayoutList className='h-5 w-5' />,
      title: 'Planeación',
      description: `${activeScheduled.length} pagos · ${activeInstallments.length} cuotas activas`,
      meta: 'Ir',
    },
    {
      href: '/configuracion/deudas',
      icon: <Landmark className='h-5 w-5' />,
      title: 'Deudas',
      description: `${activeDebts.length} activas`,
      meta: 'Revisar',
    },
    {
      href: '/configuracion/app',
      icon: <AppWindow className='h-5 w-5' />,
      title: 'App/PWA',
      description: 'Instalación, acceso rápido y estado visual',
      meta: 'Info',
    },
    {
      href: '/configuracion/seguridad',
      icon: <KeyRound className='h-5 w-5' />,
      title: 'Seguridad',
      description: 'Acceso, contraseña, sesión y zona peligrosa',
      meta: 'Cuenta',
      tone: 'text-red-100 bg-red-500/12 border-red-300/20',
    },
  ]

  return (
    <div className='space-y-5'>
      <section className='glass-panel rounded-[2rem] p-5 sm:p-6'>
        <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Ajustes</p>
        <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Configuración</h1>
        <p className='mt-2 text-sm text-slate-400'>Elige qué quieres ajustar.</p>
      </section>

      <div className='grid gap-3 lg:grid-cols-2'>
        {sections.map((section) => (
          <SettingsOptionCard key={section.href} {...section} />
        ))}
      </div>

      <div className='hidden items-center justify-center gap-2 text-xs text-slate-600 sm:flex'>
        <span>Wallet Pipe</span>
        <ChevronRight className='h-3 w-3' />
        <span>Ajustes</span>
      </div>
    </div>
  )
}
