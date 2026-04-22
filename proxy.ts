
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
       const path = request.nextUrl.pathname;

       // Define public paths that don't require authentication
       // Root '/' is the login page in this app.
       const isPublicPath = path === '/' || path === '/register';

       // Get the user's token/cookie from simply-stored cookie
       const token = request.cookies.get('user_email')?.value;

       // 1. Redirect to dashboard if logged in and trying to access public paths
       if (isPublicPath && token) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
       }

       // 2. Redirect to root if trying to access protected paths without a token
       if (!isPublicPath && !token) {
              return NextResponse.redirect(new URL('/', request.url));
       }

       return NextResponse.next();
}

// Configure paths to match
export const config = {
       matcher: [
              '/',
              '/dashboard/:path*', // Protect all dashboard routes
              '/onboarding',       // Protect onboarding
              '/admin/:path*',      // Also protect any top-level admin paths if they exist
       ]
};
