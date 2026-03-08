import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/admin/vendors — List all vendors (Super Admin only)
export async function GET(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const { data: vendors, error: dbError } = await db
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }

  return NextResponse.json({ vendors });
}

// POST /api/admin/vendors — Create a new vendor (Super Admin only)
export async function POST(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const { name, logo_url } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
  }

  const { data: vendor, error: dbError } = await db
    .from('vendors')
    .insert({ name, logo_url: logo_url || null })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Vendor created', vendor }, { status: 201 });
}
