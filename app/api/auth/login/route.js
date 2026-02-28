import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured. Set Supabase env vars.' }, { status: 503 });
    }

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Fetch user profile (use admin client to bypass RLS)
    const db = supabaseAdmin || supabase;
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Profile missing — create it from auth metadata
      const meta = authData.user.user_metadata || {};
      const fallbackName = meta.name || email.split('@')[0];
      const fallbackProfile = {
        id: authData.user.id,
        name: fallbackName,
        email,
        role: meta.role || 'Team Member',
        dept: meta.dept || 'General',
        avatar: fallbackName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        wallet_address: null,
        balance: 200,
        allowance: 500,
      };

      const { data: newProfile } = await db
        .from('profiles')
        .upsert(fallbackProfile)
        .select()
        .single();

      return NextResponse.json({
        message: 'Logged in',
        user: newProfile || fallbackProfile,
        token: authData.session?.access_token,
      });
    }

    return NextResponse.json({
      message: 'Logged in',
      user: profile,
      token: authData.session?.access_token,
    });

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
