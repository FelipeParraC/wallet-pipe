'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Receipt, PieChart, Settings, LogOut, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui'
import { logout } from '@/actions'
import { useSession } from 'next-auth/react'
import { User } from '@/interfaces'

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Billeteras', href: '/billeteras', icon: Wallet },
    { name: 'Transacciones', href: '/transacciones', icon: Receipt },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export const Navbar = () => {

    const [user, setUser] = useState<User | null>(null)

    const { data: session } = useSession()

    useEffect(() => {
        const user = session?.user || null
        setUser( user )
    }, [session])
        
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const closeMenu = () => setIsOpen(false)

    const onClickLogout = async () => {
        closeMenu()
        await logout()
        window.location.replace('/auth/login')
    }

    const appName = user ? `Wallet ${ user.nickname }` : 'Wallet'

    return (
        <nav className='bg-transparent text-gray-800 dark:text-white'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-16 pt-4'>
                    <div className='flex items-center'>
                        <Link href='/' className='flex-shrink-0'>
                            <span className='text-2xl font-bold'>{appName}</span>
                        </Link>
                    </div>
                    <div className='hidden md:block'>
                        <div className='flex items-baseline space-x-4'>
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${pathname === item.href
                                            ? 'bg-gray-200 dark:bg-gray-700 text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        } px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200`}
                                >
                                    <item.icon className='w-4 h-4 mr-2' />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className='hidden md:block'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                                    <Avatar className='h-8 w-8'>
                                        <AvatarImage src='' alt='@usuario' />
                                        <AvatarFallback>{user?.name[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-56' align='end' forceMount>
                                <DropdownMenuLabel className='font-normal'>
                                    <div className='flex flex-col space-y-1'>
                                        <p className='text-sm font-medium leading-none'>{user?.name || 'Usuario'}</p>
                                        <p className='text-xs leading-none text-muted-foreground'>
                                            {user?.email || 'usuario@example.com'}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className='mr-2 h-4 w-4' />
                                    <span>Configuración</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={ onClickLogout }>
                                    <LogOut className='mr-2 h-4 w-4' />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className='md:hidden'>
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant='ghost' size='icon' className='text-gray-800 dark:text-white'>
                                    <Menu className='h-6 w-6' />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side='right' className='bg-white dark:bg-gray-800 text-gray-800 dark:text-white'>
                                <SheetHeader>
                                    <SheetTitle className='text-white'>Menú</SheetTitle>
                                    <SheetDescription className='text-blue-100'>
                                        Navegación y acciones rápidas
                                    </SheetDescription>
                                </SheetHeader>
                                <div className='mt-4 space-y-4'>
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${pathname === item.href
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-white'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                } transition-colors duration-200`}
                                            onClick={closeMenu}
                                        >
                                            <item.icon className='w-4 h-4 mr-2' />
                                            {item.name}
                                        </Link>
                                    ))}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' className='w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'>
                                                <Avatar className='h-8 w-8 mr-2'>
                                                    <AvatarImage src='' alt='@usuario' />
                                                    <AvatarFallback>{user?.name[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{user?.name || 'Usuario'}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={closeMenu}>
                                                <Settings className='mr-2 h-4 w-4' />
                                                <span>Configuración</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={ onClickLogout }>
                                                <LogOut className='mr-2 h-4 w-4' />
                                                <span>Cerrar sesión</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    )
}

