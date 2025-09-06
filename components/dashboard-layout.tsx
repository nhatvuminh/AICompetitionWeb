'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icons } from '@/components/icons'
import { ThemeToggle } from '@/components/mode-toggle'

interface NavigationItem {
  title: string
  href: string
  icon: keyof typeof Icons
  badge?: string
  adminOnly?: boolean
}

const navigation: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'pizza', // You might want to change this to a more appropriate icon
  },
  {
    title: 'Upload Document',
    href: '/dashboard/upload',
    icon: 'add',
  },
  {
    title: 'My Documents',
    href: '/dashboard/documents',
    icon: 'post',
  },
  {
    title: 'Shared Documents',
    href: '/dashboard/shared',
    icon: 'user',
  },
  {
    title: 'Permissions',
    href: '/dashboard/admin/permissions',
    icon: 'settings',
    adminOnly: true,
  },
  {
    title: 'Reports',
    href: '/dashboard/admin/reports',
    icon: 'billing',
    adminOnly: true,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: 'settings',
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  headerActions?: React.ReactNode
}

export function DashboardLayout({
  children,
  title,
  description,
  headerActions,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAdmin, handleLogout } = useAuth()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin()
  )

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = Icons[item.icon]
    const isActive = pathname === item.href

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {item.title}
        {item.badge && (
          <Badge variant="secondary" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Icons.logo className="h-6 w-6" />
          Document Security
        </Link>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>
      
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Icons.settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <Icons.arrowRight className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/20 md:block md:w-64">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Icons.ellipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="flex-1">
              {title && (
                <div>
                  <h1 className="text-lg font-semibold">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {headerActions}
              <ThemeToggle />
              {isAdmin() && (
                <Badge variant="secondary">Admin</Badge>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
