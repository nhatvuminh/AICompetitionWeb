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
    token,
    refreshToken,
    isAuthenticated,
    twoFactorRequired,
    twoFactorSessionId,
  } = useSelector((state: RootState) => state.auth || {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    twoFactorRequired: false,
    twoFactorSessionId: null,
  })

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedRefreshToken && savedUser) {
      try {
        // Check if token is expired
        const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]))
        const isTokenExpired = tokenPayload.exp * 1000 < Date.now()
        
        if (isTokenExpired) {
          // Token expired, clear storage and don't restore auth
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          return
        }
        
        const userData = JSON.parse(savedUser)
        dispatch(setCredentials({
          user: userData,
          token: savedToken,
          refreshToken: savedRefreshToken,
        }))
      } catch (error) {
        console.error('Failed to parse saved data:', error)
        // Clear invalid data
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
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
    if (token && refreshToken) {
      // Set up token refresh 5 minutes before expiry
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = tokenPayload.exp * 1000
      const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000 // 5 minutes before expiry
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(async () => {
          try {
            const result = await refreshTokenMutation({ refreshToken }).unwrap()
            dispatch(setCredentials({
              user: user!,
              token: result.token,
              refreshToken: result.refreshToken,
            }))
          } catch (error) {
            // If refresh fails, logout user
            dispatch(clearCredentials())
            router.push('/login')
          }
        }, refreshTime)

        return () => clearTimeout(timeoutId)
      }
    }
  }, [token, refreshToken, refreshTokenMutation, dispatch, router, user])

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password }).unwrap()
      
      if (result.requiresTwoFactor) {
        dispatch(setTwoFactorRequired({ sessionId: result.sessionId! }))
        return { requiresTwoFactor: true, sessionId: result.sessionId }
      } else {
        dispatch(setCredentials({
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        }))
        
        // Store tokens and user in localStorage for persistence
        localStorage.setItem('token', result.token)
        localStorage.setItem('refreshToken', result.refreshToken)
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
        token: result.token,
        refreshToken: result.refreshToken,
      }))

      // Store tokens and user in localStorage for persistence
      localStorage.setItem('token', result.token)
      localStorage.setItem('refreshToken', result.refreshToken)
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
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
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
