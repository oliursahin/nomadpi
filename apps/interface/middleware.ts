import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Allow public routes
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }

  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if accessing protected route without auth
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
