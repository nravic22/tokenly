import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password, role, dept, vendor_id } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured. Set Supabase env vars.' }, { status: 503 });
    }

    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: role || 'Team Member', dept: dept || 'General' }
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert user profile
    const db = supabaseAdmin || supabase;
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const { data: profiles, error: profileError } = await db
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        role: role || 'Team Member',
        dept: dept || 'General',
        avatar,
        wallet_address: null,
        balance: 200,
        allowance: 500,
      })
      .select();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return NextResponse.json({ error: 'Account created but profile setup failed. Try logging in.' }, { status: 500 });
    }

    // 3. Link user to vendor if signing up from a vendor page
    if (vendor_id) {
      const { error: linkError } = await db
        .from('user_vendor_roles')
        .insert({
          user_id: authData.user.id,
          vendor_id,
          role: 'employee',
          is_active: true,
        });

      if (linkError) {
        console.error('Vendor link error:', linkError);
        // Don't fail signup — user is created, just not linked yet
      }
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: profiles?.[0],
    });

  } catch (err) {
    console.error('Signup exception:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
