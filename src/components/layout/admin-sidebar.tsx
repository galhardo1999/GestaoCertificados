'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Shield, ChevronLeft, ChevronRight, LogOut, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

const menuItems = [
    {
        title: 'Início',
        href: '/admin',
        icon: Home,
    },
    {
        title: 'Empresas',
        href: '/admin/empresas',
        icon: Building2,
    },
    {
        title: 'Planos',
        href: '/admin/planos',
        icon: Shield,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <div
            className={cn(
                'flex h-full flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300',
                isExpanded ? 'w-64' : 'w-20'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-800 px-4 justify-between">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold">
                                Admin
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(false)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 mx-auto">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(true)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
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
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
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
            <div className="border-t border-slate-800 p-3">
                <Button
                    variant="ghost"
                    className={cn(
                        'w-full flex items-center gap-3 justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20',
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
