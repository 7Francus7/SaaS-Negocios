
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
       const path = request.nextUrl.pathname;

       // Define public paths that don't require authentication
       const isPublicPath = path === '/' || path === '/login' || path === '/register';

       // Get the user's token/cookie
       // In a real app, you would verify the JWT token here
       const token = request.cookies.get('user_email')?.value;

       // 1. Redirect to dashboard if logged in and trying to access public paths (like login)
       if (isPublicPath && token) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
       }

       // 2. Redirect to login if trying to access protected paths without a token
       if (!isPublicPath && !token) {
              return NextResponse.redirect(new URL('/login', request.url));
       }

       return NextResponse.next();
}

// Configure paths to match
export const config = {
       matcher: [
              '/',
              '/login',
              '/dashboard/:path*', // Protect all dashboard routes
              '/onboarding',       // Protect onboarding
       ]
};
