'use client'

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '@/lib/store'
import {
  useLoginMutation,
  useVerifyTwoFactorMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  setCredentials,
  setTwoFactorRequired,
  clearCredentials,
  User,
} from '@/lib/store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  
  const {
    user,
    tokens,
    isAuthenticated,
    twoFactorRequired,
    twoFactorSessionId,
  } = useSelector((state: RootState) => state.auth || {
    user: null,
    tokens: null,
    isAuthenticated: false,
    twoFactorRequired: false,
    twoFactorSessionId: null,
  })

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const savedTokens = localStorage.getItem('tokens')
    const savedUser = localStorage.getItem('user')
    
    if (savedTokens && savedUser) {
      try {
        const tokens = JSON.parse(savedTokens)
        const userData = JSON.parse(savedUser)
        
        // Check if token is expired
        const isTokenExpired = new Date(tokens.access.expires) <= new Date()
        
        if (isTokenExpired) {
          // Token expired, clear storage and don't restore auth
          localStorage.removeItem('tokens')
          localStorage.removeItem('user')
          return
        }
        
        dispatch(setCredentials({
          user: userData,
          tokens: tokens,
        }))
      } catch (error) {
        console.error('Failed to parse saved data:', error)
        // Clear invalid data
        localStorage.removeItem('tokens')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  const [login, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation()
  const [verifyTwoFactor, { isLoading: is2FALoading, error: twoFactorError }] = useVerifyTwoFactorMutation()
  const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation()
  const [refreshTokenMutation] = useRefreshTokenMutation()

  // Auto-refresh token before expiry
  useEffect(() => {
    if (tokens?.access && tokens?.refresh) {
      // Set up token refresh 5 minutes before expiry
      const expiryTime = new Date(tokens.access.expires).getTime()
      const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000 // 5 minutes before expiry
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(async () => {
          try {
            const result = await refreshTokenMutation({ refreshToken: tokens.refresh.token }).unwrap()
            dispatch(setCredentials({
              user: user!,
              tokens: result,
            }))
            
            // Update localStorage
            localStorage.setItem('tokens', JSON.stringify(result))
          } catch (error) {
            // If refresh fails, logout user
            dispatch(clearCredentials())
            localStorage.removeItem('tokens')
            localStorage.removeItem('user')
            router.push('/login')
          }
        }, refreshTime)

        return () => clearTimeout(timeoutId)
      }
    }
  }, [tokens, refreshTokenMutation, dispatch, router, user])

  const handleLogin = async (emailOrUsername: string, password: string) => {
    try {
      // Always use email for login (if username provided, treat as email for now)
      const email = emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@example.com`
      
      const result = await login({ email, password }).unwrap()
      
      if (result.requiresTwoFactor) {
        dispatch(setTwoFactorRequired({ sessionId: result.sessionId! }))
        return { requiresTwoFactor: true, sessionId: result.sessionId }
      } else {
        dispatch(setCredentials({
          user: result.user,
          tokens: result.tokens,
        }))
        
        // Store tokens and user in localStorage for persistence
        localStorage.setItem('tokens', JSON.stringify(result.tokens))
        localStorage.setItem('user', JSON.stringify(result.user))
        
        return { success: true, user: result.user }
      }
      
    } catch (error: any) {
      throw new Error(error.data?.message || 'Login failed')
    }
  }


  const handleTwoFactorVerification = async (otpCode: string) => {
    if (!twoFactorSessionId) {
      throw new Error('No 2FA session found')
    }

    try {
      const result = await verifyTwoFactor({
        sessionId: twoFactorSessionId,
        code: otpCode,
      }).unwrap()

      dispatch(setCredentials({
        user: result.user,
        tokens: result.tokens,
      }))

      // Store tokens and user in localStorage for persistence
      localStorage.setItem('tokens', JSON.stringify(result.tokens))
      localStorage.setItem('user', JSON.stringify(result.user))

      return { success: true, user: result.user }
    } catch (error: any) {
      throw new Error(error.data?.message || '2FA verification failed')
    }
  }

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } catch (error) {
      // Even if server logout fails, clear local state
      console.error('Logout error:', error)
    } finally {
      dispatch(clearCredentials())
      localStorage.removeItem('tokens')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const hasRole = (role: User['role']) => {
    return user?.role === role
  }

  const isAdmin = () => hasRole('admin')

  // Check if user has access to a specific route
  const canAccess = (requiredRole?: User['role']) => {
    if (!isAuthenticated) return false
    if (!requiredRole) return true
    return hasRole(requiredRole)
  }

  return {
    user,
    isAuthenticated,
    twoFactorRequired,
    twoFactorSessionId,
    isLoginLoading,
    is2FALoading,
    isLogoutLoading,
    loginError,
    twoFactorError,
    handleLogin,
    handleTwoFactorVerification,
    handleLogout,
    hasRole,
    isAdmin,
    canAccess,
  }
}
