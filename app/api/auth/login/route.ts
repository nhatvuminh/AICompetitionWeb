import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://172.20.10.6:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the real API
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Return the response from the real API
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
