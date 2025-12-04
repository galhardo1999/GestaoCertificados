'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Shield, ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

const menuItems = [
    {
        title: 'Início',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Clientes',
        href: '/dashboard/clientes',
        icon: Users,
    },
    {
        title: 'Configurações',
        href: '/dashboard/configuracoes',
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <div
            className={cn(
                'flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300',
                isExpanded ? 'w-64' : 'w-20'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-gray-200 px-4 justify-between">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                                SaaS Certificado
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(false)}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 mx-auto">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(true)}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>


            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                                !isExpanded && 'justify-center'
                            )}
                            title={!isExpanded ? item.title : undefined}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {isExpanded && <span>{item.title}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3">
                <Button
                    variant="ghost"
                    className={cn(
                        'w-full flex items-center gap-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50',
                        !isExpanded && 'justify-center px-2'
                    )}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    title={!isExpanded ? 'Sair' : undefined}
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && <span>Sair</span>}
                </Button>
            </div>
        </div>
    )
}
