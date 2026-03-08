import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/admin/vendors/:id — Get vendor details + employees
export async function GET(request, { params }) {
  const { id } = await params;
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const { data: vendor } = await db
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Fetch all members of this vendor
  const { data: members } = await db
    .from('user_vendor_roles')
    .select(`
      id,
      role,
      is_active,
      user:profiles (
        id, name, email, avatar
      )
    `)
    .eq('vendor_id', id);

  return NextResponse.json({ vendor, members: members || [] });
}

// PATCH /api/admin/vendors/:id — Update vendor (name, logo, block/unblock)
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const body = await request.json();
  const updates = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: vendor, error: dbError } = await db
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }

  return NextResponse.json({
    message: updates.is_active === false ? 'Vendor blocked' : 'Vendor updated',
    vendor,
  });
}

// DELETE /api/admin/vendors/:id — Soft delete (block) a vendor
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const { error: dbError } = await db
    .from('vendors')
    .update({ is_active: false })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to block vendor' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Vendor blocked successfully' });
}
