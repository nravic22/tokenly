import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, isVendorActive } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// PATCH /api/vendor/profile — Vendor admin updates their vendor's logo/name
export async function PATCH(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const { vendor_id, name, logo_url } = await request.json();

  if (!vendor_id) {
    return NextResponse.json({ error: 'vendor_id is required' }, { status: 400 });
  }

  const active = await isVendorActive(vendor_id);
  if (!active) {
    return NextResponse.json({ error: 'Vendor is suspended' }, { status: 403 });
  }

  const { data: memberships } = await db
    .from('user_vendor_roles')
    .select('role')
    .eq('user_id', profile.id)
    .eq('vendor_id', vendor_id)
    .eq('is_active', true)
    .limit(1);

  const membership = memberships?.[0];
  if (!membership || membership.role !== 'vendor_admin') {
    return NextResponse.json({ error: 'Only vendor admins can update vendor profile' }, { status: 403 });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (logo_url !== undefined) updates.logo_url = logo_url;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: rows, error: dbError } = await db
    .from('vendors')
    .update(updates)
    .eq('id', vendor_id)
    .select();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Vendor profile updated', vendor: rows?.[0] });
}
