// SERVERLESS ARCHITECTURE (CLOUD PATTERN)
// OAuth callback handler
// Exchanges the auth code from Google for a Supabase session,
// then creates or updates the user's profile.
// No traditional server — pure serverless execution.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create/update profile for OAuth users
      const displayName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.display_name ||
        data.user.email?.split('@')[0] ||
        'User';

      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          display_name: displayName,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}
