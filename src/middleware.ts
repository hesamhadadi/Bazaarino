import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protect admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Forward the current pathname so server components can render
    // maintenance + announcement banners conditionally.
    const res = NextResponse.next();
    res.headers.set('x-pathname', pathname);
    return res;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Admin/profile/favorites/new-ad require auth
        if (
          pathname.startsWith('/admin') ||
          pathname.startsWith('/profile') ||
          pathname.startsWith('/favorites') ||
          pathname.startsWith('/messages') ||
          pathname.startsWith('/saved-searches') ||
          pathname === '/ads/new' ||
          pathname.startsWith('/news/new')
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    // Run on every page except static assets / Next internals / API.
    '/((?!api|_next/static|_next/image|favicon|icons|manifest|robots|sitemap|feed|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml|json|woff|woff2)$).*)',
  ],
};
