import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://172.20.10.6:3000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const authHeader = request.headers.get('authorization')
    
    // Forward the request to the real API
    const response = await fetch(`${API_BASE_URL}/v1/files/upload`, {
      method: 'POST',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: formData,
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
