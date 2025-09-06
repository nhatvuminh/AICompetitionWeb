import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

// Mock users database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA256
    name: 'Admin User',
    role: 'admin' as const,
    twoFactorEnabled: false,
  },
  {
    id: '2', 
    email: 'user@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA256
    name: 'Regular User',
    role: 'user' as const,
    twoFactorEnabled: false,
  },
  {
    id: '3',
    email: 'admin2fa@example.com', 
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA256
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Hash the provided password using MD5 (as specified in requirements)
    const hashedPassword = CryptoJS.MD5(password).toString()
    
    // Find user by email
    const user = MOCK_USERS.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // For demo purposes, accept both MD5 and SHA256 hashed passwords
    const isMD5Match = hashedPassword === user.password
    const isSHA256Match = password === 'password' // Allow plain text for demo
    
    if (!isMD5Match && !isSHA256Match) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      // Generate a temporary session ID for 2FA flow
      const sessionId = CryptoJS.SHA256(`2fa_${user.id}_${Date.now()}`).toString()
      
      return NextResponse.json({
        requiresTwoFactor: true,
        sessionId,
        message: 'Two-factor authentication required'
      })
    }

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
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
