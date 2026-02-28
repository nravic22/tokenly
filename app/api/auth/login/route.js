import { supabase } from '@/lib/supabase';
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

    // 2. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        message: 'Logged in',
        user: {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          email,
          role: authData.user.user_metadata?.role || 'Team Member',
          dept: authData.user.user_metadata?.dept || 'General',
          avatar: (authData.user.user_metadata?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          balance: 200,
          allowance: 500,
        },
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
