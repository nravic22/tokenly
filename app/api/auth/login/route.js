import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getUserVendors } from '@/lib/auth';
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
    const db = supabaseAdmin || supabase;
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
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
        platform_role: 'user',
      };

      const { data: newProfile } = await db
        .from('profiles')
        .upsert(fallbackProfile)
        .select()
        .single();

      const userProfile = newProfile || fallbackProfile;
      return NextResponse.json({
        message: 'Logged in',
        user: userProfile,
        token: authData.session?.access_token,
        vendors: [],
      });
    }

    // 3. Check vendor memberships
    const isSuperAdmin = profile.platform_role === 'super_admin';

    // If not a super admin, check if the user belongs to any active vendor
    let vendors = [];
    if (!isSuperAdmin) {
      vendors = await getUserVendors(profile.id);

      if (vendors.length === 0) {
        // User exists but has no active vendor memberships
        // Allow login but flag it — the frontend can handle this
      }
    }

    return NextResponse.json({
      message: 'Logged in',
      user: profile,
      token: authData.session?.access_token,
      is_super_admin: isSuperAdmin,
      vendors, // empty for super admins (they see all), populated for others
    });

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
