import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/send-to-tray',
  '/api/send-to-scoring',
  '/api/google-sheets',
  '/api/analyze-columns',
  '/api/validate',
  '/api/validate-ai-batch',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle API routes separately
  if (pathname.startsWith('/api/')) {
    return handleApiRoute(request, pathname)
  }

  // For all other routes (pages), require Vercel Team Authentication
  return checkPageAuthentication(request)
}

function handleApiRoute(request: NextRequest, pathname: string) {
  // CORS handling for external webhooks (OPTIONS preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Check authentication for protected routes
  if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
    const authResult = checkAuthentication(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: authResult.message,
        },
        { status: 401 }
      )
    }

    // Add user info to request headers for API routes to use
    const response = NextResponse.next()
    if (authResult.user) {
      response.headers.set('x-user-email', authResult.user.email || '')
      response.headers.set('x-user-id', authResult.user.id || '')
      response.headers.set('x-user-name', authResult.user.name || '')
    }

    // Add CORS headers to actual API responses
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')

    return response
  }

  // For non-protected API routes, just add CORS and continue
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  return response
}

function checkPageAuthentication(request: NextRequest) {
  // Check for Vercel Team Authentication
  const authResult = checkAuthentication(request)

  if (!authResult.authenticated) {
    // Redirect to Vercel login
    // In production with Vercel Team Auth enabled, this will be handled automatically
    // For local development, we'll allow access
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next()
    }

    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please log in with your Vercel team account to access this application.',
      },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

function checkAuthentication(request: NextRequest): {
  authenticated: boolean
  message: string
  user?: { id: string; email: string; name: string }
} {
  // Option 1: Check for Vercel Team Authentication cookie
  const vercelAuth = request.cookies.get('_vercel_jwt')

  if (vercelAuth) {
    // In production, Vercel's auth is protecting the app
    return {
      authenticated: true,
      message: 'Authenticated via Vercel',
      user: {
        id: 'vercel-user',
        email: 'user@vercel.com', // Would come from decoded JWT
        name: 'Vercel User',
      },
    }
  }

  // Option 2: Check for custom API key (for service-to-service calls)
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.INTERNAL_API_KEY

  if (apiKey && validApiKey && apiKey === validApiKey) {
    return {
      authenticated: true,
      message: 'Authenticated via API key',
      user: {
        id: 'api-key-user',
        email: 'system@internal.com',
        name: 'System User',
      },
    }
  }

  // Option 3: Check for session cookie (if using NextAuth or similar)
  const sessionToken = request.cookies.get('next-auth.session-token') ||
                       request.cookies.get('__Secure-next-auth.session-token')

  if (sessionToken) {
    return {
      authenticated: true,
      message: 'Authenticated via session',
      user: {
        id: 'session-user',
        email: 'user@company.com',
        name: 'Authenticated User',
      },
    }
  }

  // Allow access in development mode
  if (process.env.NODE_ENV === 'development') {
    return {
      authenticated: true,
      message: 'Development mode',
      user: {
        id: 'dev-user',
        email: 'dev@localhost',
        name: 'Developer',
      },
    }
  }

  return {
    authenticated: false,
    message: 'Authentication required. Please ensure you are logged in to your Vercel account.',
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
