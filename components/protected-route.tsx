'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Icons } from '@/components/icons'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
  fallbackUrl?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackUrl = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, canAccess } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`${fallbackUrl}?from=${window.location.pathname}`)
      return
    }

    if (requiredRole && !canAccess(requiredRole)) {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, canAccess, requiredRole, router, fallbackUrl])

  // Show loading spinner while checking authentication
  if (!isAuthenticated || (requiredRole && !canAccess(requiredRole))) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Icons.spinner className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Admin-only route wrapper
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallbackUrl="/dashboard">
      {children}
    </ProtectedRoute>
  )
}

// User route wrapper (both admin and user can access)
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
