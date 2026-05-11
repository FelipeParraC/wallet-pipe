'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Menu, Plus, Receipt, Settings2, Wallet } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui'
import { logout } from '@/actions'
import { useSession } from 'next-auth/react'

const navItems = [
    { name: 'Inicio', href: '/', icon: LayoutDashboard },
    { name: 'Cuentas', href: '/billeteras', icon: Wallet },
    { name: 'Movimientos', href: '/movimientos', icon: Receipt },
    { name: 'Planeación', href: '/planeacion', icon: CreditCard },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    { name: 'Ajustes', href: '/configuracion', icon: Settings2 },
]

const mobileDockItems = [
    { name: 'Inicio', href: '/', icon: LayoutDashboard },
    { name: 'Cuentas', href: '/billeteras', icon: Wallet },
    { name: 'Movimientos', href: '/movimientos', icon: Receipt },
    { name: 'Planeación', href: '/planeacion', icon: CreditCard },
]

export const Navbar = () => {
    const pathname = usePathname()
    const { data: session } = useSession()
    const user = session?.user
    const hideMobileNewAction = pathname === '/movimientos/nueva' || pathname.startsWith('/movimientos/editar')

    if (!user) {
        return null
    }

    const onClickLogout = async () => {
        await logout()
        window.location.replace('/auth/login')
    }

    const appName = `Wallet ${user.nickname}`

    return (
        <>
            <header className='sticky top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-4'>
                <div className='mx-auto flex max-w-7xl items-center justify-between gap-3'>
                    <Link
                        href='/'
                        className='glass-pill flex h-14 items-center gap-3 rounded-[1.75rem] px-3 text-white sm:px-4'
                    >
                        <Image
                            src='/logo192.png'
                            alt='Wallet Pipe'
                            width={42}
                            height={42}
                            priority
                            className='h-10 w-10 rounded-[1.05rem] shadow-[0_12px_28px_rgba(14,165,233,0.24)]'
                        />
                        <div className='hidden sm:block'>
                            <p className='text-[11px] uppercase tracking-[0.28em] text-slate-400'>Wallet Pipe</p>
                            <p className='text-sm font-semibold text-slate-100'>{appName}</p>
                        </div>
                    </Link>

                    <nav className='glass-pill hidden items-center gap-1 rounded-[1.75rem] px-2 py-2 lg:flex'>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-[0_12px_25px_rgba(14,165,233,0.3)]'
                                            : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
                                    ].join(' ')}
                                >
                                    <item.icon className='h-4 w-4' />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className='flex items-center gap-2'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline' className='h-14 rounded-[1.75rem] px-3.5'>
                                    <Avatar className='h-8 w-8'>
                                        {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email ?? 'Usuario'} />}
                                        <AvatarFallback className='bg-sky-500/20 text-sky-100'>
                                            {user.name?.[0] || user.email?.[0] || 'W'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='hidden text-left sm:block'>
                                        <p className='text-xs text-slate-400'>{user.email}</p>
                                        <p className='text-sm font-semibold text-white'>{user.name}</p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-64'>
                                <DropdownMenuLabel className='font-normal'>
                                    <div className='flex flex-col space-y-1'>
                                        <p className='text-sm font-medium leading-none'>{user.name}</p>
                                        <p className='text-xs leading-none text-muted-foreground'>
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href='/configuracion'>
                                        <Settings2 className='mr-2 h-4 w-4' />
                                        Ajustes
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onClickLogout}>
                                    <LogOut className='mr-2 h-4 w-4' />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant='outline' size='icon' className='h-14 w-14 rounded-[1.75rem] lg:hidden'>
                                    <Menu className='h-5 w-5' />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side='right' className='w-[90vw] sm:max-w-md'>
                                <SheetHeader>
                                    <SheetTitle>Menú</SheetTitle>
                                    <SheetDescription>{appName}</SheetDescription>
                                </SheetHeader>
                                <div className='mt-6 grid gap-3'>
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={[
                                                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                                    isActive
                                                        ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_12px_25px_rgba(14,165,233,0.28)]'
                                                        : 'bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]',
                                                ].join(' ')}
                                            >
                                                <item.icon className='h-4 w-4' />
                                                {item.name}
                                            </Link>
                                        )
                                    })}

                                    <Button variant='ghost' className='mt-2 justify-start rounded-2xl px-4' onClick={onClickLogout}>
                                        <LogOut className='mr-2 h-4 w-4' />
                                        Cerrar sesión
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            <nav className='pointer-events-none fixed inset-x-0 bottom-4 z-40 px-3 lg:hidden'>
                <div className='pointer-events-auto mx-auto flex max-w-md items-center justify-center gap-2'>
                    <div className='grid min-w-0 flex-1 grid-cols-4 gap-1.5 rounded-[1.8rem] border border-white/10 bg-slate-950/72 p-2 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-2xl'>
                        {mobileDockItems.map((item) => {
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-[0_10px_22px_rgba(14,165,233,0.28)]'
                                            : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
                                    ].join(' ')}
                                >
                                    <item.icon className='h-4 w-4' />
                                    <span className='max-w-full truncate'>{item.name}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {!hideMobileNewAction && (
                        <Link
                            href='/movimientos/nueva'
                            className='flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[1.6rem] border border-sky-200/20 bg-gradient-to-b from-sky-400 to-blue-600 text-[11px] font-medium text-white shadow-[0_18px_36px_rgba(14,165,233,0.32)] transition-all duration-200 hover:brightness-110'
                        >
                            <Plus className='h-5 w-5' />
                            <span className='truncate'>Nuevo</span>
                        </Link>
                    )}
                </div>
            </nav>
        </>
    )
}
