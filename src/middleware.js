import { NextResponse } from 'next/server';

// Define which routes should be protected
const protectedRoutes = [
  '/home',
  '/profile',
  '/profile-settings',
  '/labs',
  '/challnges',
  '/events',
  '/leaderboard',
  '/add-challenge',
];

// Define which routes should be accessible only to non-authenticated users
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get the token from cookies
  const token = request.cookies.get('token');
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the path is an auth route (login, signup, etc.)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If it's a protected route and there's no token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // If it's an auth route and there is a token, redirect to home
  if (isAuthRoute && token) {
    const url = new URL('/home', request.url);
    return NextResponse.redirect(url);
  }
  
  // Otherwise, allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 