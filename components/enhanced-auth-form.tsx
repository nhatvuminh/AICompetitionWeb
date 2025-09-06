'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Icons } from '@/components/icons'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const twoFactorSchema = z.object({
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
})

type LoginFormData = z.infer<typeof loginSchema>
type TwoFactorFormData = z.infer<typeof twoFactorSchema>

interface EnhancedAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'login' | 'register'
}

export function EnhancedAuthForm({ className, mode = 'login', ...props }: EnhancedAuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    twoFactorRequired,
    isLoginLoading,
    is2FALoading,
    loginError,
    twoFactorError,
    handleLogin,
    handleTwoFactorVerification,
  } = useAuth()

  const [showPassword, setShowPassword] = useState(false)

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 2FA form
  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      otpCode: '',
    },
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const result = await handleLogin(data.email, data.password)
      
      if (result.requiresTwoFactor) {
        toast({
          title: '2FA Required',
          description: 'Please check your authenticator app for the verification code.',
        })
      } else if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        })
        const redirectUrl = searchParams?.get('from') || '/dashboard'
        router.push(redirectUrl)
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred during login.',
        variant: 'destructive',
      })
    }
  }

  const onTwoFactorSubmit = async (data: TwoFactorFormData) => {
    try {
      const result = await handleTwoFactorVerification(data.otpCode)
      
      if (result.success) {
        toast({
          title: 'Authentication Successful',
          description: 'You have been successfully logged in.',
        })
        const redirectUrl = searchParams?.get('from') || '/dashboard'
        router.push(redirectUrl)
      }
    } catch (error: any) {
      toast({
        title: '2FA Verification Failed',
        description: error.message || 'Invalid verification code.',
        variant: 'destructive',
      })
    }
  }

  const handleBackToLogin = () => {
    twoFactorForm.reset()
    // You might want to clear the 2FA state here if needed
  }

  // Show 2FA form if required
  if (twoFactorRequired) {
    return (
      <div className={cn('grid gap-6', className)} {...props}>
        <div className="flex flex-col space-y-2 text-center">
          <Icons.shield className="mx-auto h-6 w-6" />
          <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        
        <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otpCode">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={twoFactorForm.watch('otpCode')}
                  onChange={(value) => twoFactorForm.setValue('otpCode', value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {twoFactorForm.formState.errors?.otpCode && (
                <p className="text-xs text-red-600 text-center">
                  {twoFactorForm.formState.errors.otpCode.message}
                </p>
              )}
            </div>
            
            <Button type="submit" disabled={is2FALoading}>
              {is2FALoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify Code
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToLogin}
              disabled={is2FALoading}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Show login form
  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoginLoading}
              {...loginForm.register('email')}
            />
            {loginForm.formState.errors?.email && (
              <p className="text-xs text-red-600">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoginLoading}
                {...loginForm.register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Icons.eyeOff className="h-4 w-4" />
                ) : (
                  <Icons.eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {loginForm.formState.errors?.password && (
              <p className="text-xs text-red-600">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>
          
          <Button type="submit" disabled={isLoginLoading}>
            {isLoginLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </form>
      
      {loginError && (
        <div className="text-sm text-red-600 text-center">
          Authentication failed. Please check your credentials.
        </div>
      )}
    </div>
  )
}
