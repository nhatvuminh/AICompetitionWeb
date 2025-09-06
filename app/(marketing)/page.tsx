'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from "@/hooks/use-auth"
import { Icons } from "@/components/icons"

export default function IndexPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect ngay lập tức dựa trên authentication status
    if (isAuthenticated === true && user) {
      // Nếu đã authenticate, chuyển sang dashboard
      router.replace('/dashboard')
    } else if (isAuthenticated === false) {
      // Nếu chưa authenticate, chuyển sang login
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  // Luôn hiển thị loading state trong khi kiểm tra authentication và redirect
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2">
          <Icons.shield className="h-8 w-8 text-primary animate-pulse" />
          <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">MB Document Security Portal</h2>
          <p className="text-sm text-muted-foreground">
            {isAuthenticated === null && 'Checking authentication...'}
            {isAuthenticated === true && 'Redirecting to dashboard...'}
            {isAuthenticated === false && 'Redirecting to login...'}
          </p>
        </div>
      </div>
    </div>
  )
}