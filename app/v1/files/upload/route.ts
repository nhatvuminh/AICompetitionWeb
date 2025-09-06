import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://172.20.10.6:3000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Get the file from formData to detect its type
    const file = formData.get('file') as File
    if (file && file.type) {
      // Use the actual file mimetype instead of hardcoding
      formData.append('type', file.type)
    } else {
      // Fallback to application/pdf if no type detected
      formData.append('type', 'application/pdf')
    }
    
    const authHeader = request.headers.get('authorization')
    
    // Forward the request to the real API
    const response = await fetch(`${API_BASE_URL}/v1/files/upload`, {
      method: 'POST',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
        // Don't set Content-Type for multipart/form-data, let fetch handle it automatically
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
