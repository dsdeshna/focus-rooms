// ============================================================
// Next.js Proxy — Auth Protection + Prometheus Metrics
// 
// This proxy runs on EVERY request. It:
// 1. Records HTTP metrics for Prometheus monitoring
// 2. Protects routes behind Supabase authentication
// 3. Redirects authenticated users away from auth pages
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const startTime = Date.now();
  let supabaseResponse = NextResponse.next({ request });

  // ── Supabase Auth Client ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route Protection ──
  const protectedPaths = ['/dashboard', '/room', '/settings'];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // ── Redirect logged-in users away from auth pages ──
  const authPaths = ['/auth/login', '/auth/signup'];
  if (authPaths.includes(request.nextUrl.pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ── Prometheus Metrics (response timing header) ──
  const duration = Date.now() - startTime;
  supabaseResponse.headers.set('X-Response-Time', `${duration}ms`);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|ambient|backgrounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
