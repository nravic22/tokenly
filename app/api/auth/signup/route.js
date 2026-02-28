import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password, role, dept } = await request.json();

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

    // 2. Insert user profile into profiles table
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const { data: profile, error: profileError } = await supabase
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
      .select()
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return NextResponse.json({ error: 'Account created but profile setup failed. Try logging in.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: profile,
    });

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
