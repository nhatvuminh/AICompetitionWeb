import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://172.20.10.6:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    
    // Forward the request to the real API
    const response = await fetch(`${API_BASE_URL}/v1/files?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
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
