"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Wallet, Receipt, PieChart, Settings, LogOut, Menu } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Billeteras', href: '/billeteras', icon: Wallet },
    { name: 'Transacciones', href: '/transacciones', icon: Receipt },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export default function Navbar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const closeMenu = () => setIsOpen(false)

    return (
        <nav className="bg-blue-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0">
                            <span className="text-2xl font-bold">Wallet Pipe</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-baseline space-x-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${pathname === item.href
                                            ? 'bg-blue-800 text-white'
                                            : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                                        } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatars/01.png" alt="@usuario" />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">Usuario</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            usuario@example.com
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configuración</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="md:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="bg-blue-900 text-white">
                                <SheetHeader>
                                    <SheetTitle className="text-white">Menú</SheetTitle>
                                    <SheetDescription className="text-blue-300">
                                        Navegación y acciones rápidas
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="mt-4 space-y-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${pathname === item.href
                                                    ? 'bg-blue-800 text-white'
                                                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                                                }`}
                                            onClick={closeMenu}
                                        >
                                            <item.icon className="w-4 h-4 mr-2" />
                                            {item.name}
                                        </Link>
                                    ))}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start text-blue-300 hover:bg-blue-800 hover:text-white">
                                                <Avatar className="h-8 w-8 mr-2">
                                                    <AvatarImage src="/avatars/01.png" alt="@usuario" />
                                                    <AvatarFallback>U</AvatarFallback>
                                                </Avatar>
                                                <span>Usuario</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={closeMenu}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Configuración</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={closeMenu}>
                                                <LogOut className="mr-2 h-4 w-4" />
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

