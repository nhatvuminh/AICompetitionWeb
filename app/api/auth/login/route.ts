import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

// Mock users database
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'c4ca4238a0b923820dcc509a6f75849b', // '1' hashed with MD5
    name: 'Admin User',
    role: 'admin' as const,
    twoFactorEnabled: false,
  },
  {
    id: '2', 
    username: 'user',
    email: 'user@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA256
    name: 'Regular User',
    role: 'user' as const,
    twoFactorEnabled: false,
  },
  {
    id: '3',
    username: 'admin2fa',
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
    const { email, username, password } = await request.json()

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { message: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Hash the provided password using MD5 (as specified in requirements)
    const hashedPassword = CryptoJS.MD5(password).toString()
    
    // Find user by email or username
    const user = MOCK_USERS.find(u => u.email === email || u.username === username)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    // Verify password using MD5 hash (as specified in security requirements)
    if (hashedPassword !== user.password) {
      return NextResponse.json(
        { message: 'Invalid username/email or password' },
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
