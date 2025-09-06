import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

// Mock users database (same as login)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    name: 'Admin User',
    role: 'admin' as const,
    twoFactorEnabled: false,
  },
  {
    id: '2', 
    email: 'user@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    name: 'Regular User',
    role: 'user' as const,
    twoFactorEnabled: false,
  },
  {
    id: '3',
    email: 'admin2fa@example.com', 
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    name: 'Admin with 2FA',
    role: 'admin' as const,
    twoFactorEnabled: true,
  }
]

// Simple JWT token generation (for demo purposes)
function generateJWT(user: any) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  }
  
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, 'your-secret-key').toString()
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function generateRefreshToken(userId: string) {
  return CryptoJS.SHA256(`refresh_${userId}_${Date.now()}`).toString()
}

// Mock 2FA session storage (in real app, this would be in database/cache)
const twoFactorSessions: Record<string, { userId: string; email: string; timestamp: number }> = {}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json()

    if (!sessionId || !code) {
      return NextResponse.json(
        { message: 'Session ID and verification code are required' },
        { status: 400 }
      )
    }

    // Check if session exists and is valid (not expired)
    const session = twoFactorSessions[sessionId]
    if (!session) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Check if session is not too old (5 minutes max)
    const now = Date.now()
    if (now - session.timestamp > 5 * 60 * 1000) {
      delete twoFactorSessions[sessionId]
      return NextResponse.json(
        { message: 'Session expired. Please login again.' },
        { status: 401 }
      )
    }

    // For demo purposes, accept any 6-digit code
    const isValidCode = /^\d{6}$/.test(code)
    if (!isValidCode) {
      return NextResponse.json(
        { message: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    // Find user
    const user = MOCK_USERS.find(u => u.email === session.email)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Clean up session
    delete twoFactorSessions[sessionId]

    // Generate tokens
    const token = generateJWT(user)
    const refreshToken = generateRefreshToken(user.id)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      refreshToken,
      message: '2FA verification successful'
    })

  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to store 2FA session (called from login endpoint)
export function storeTwoFactorSession(sessionId: string, userId: string, email: string) {
  twoFactorSessions[sessionId] = {
    userId,
    email,
    timestamp: Date.now()
  }
}
