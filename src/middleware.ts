import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return Response.redirect(loginUrl);
  }

  // If logged in and trying to access login page
  if (isLoggedIn && pathname === '/login') {
    return Response.redirect(new URL('/', req.nextUrl.origin));
  }
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
