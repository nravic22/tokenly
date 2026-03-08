import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, isSuperAdmin, requireVendorAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// PATCH /api/vendor/employees/:id — Update employee role or deactivate
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const { data: memberships } = await db
    .from('user_vendor_roles')
    .select('*')
    .eq('id', id)
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  if (!isSuperAdmin(profile)) {
    const forbidden = await requireVendorAdmin(profile.id, membership.vendor_id);
    if (forbidden) return forbidden;
  }

  const body = await request.json();
  const updates = {};

  if (body.role !== undefined) updates.role = body.role;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: rows, error: dbError } = await db
    .from('user_vendor_roles')
    .update(updates)
    .eq('id', id)
    .select();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Employee updated', membership: rows?.[0] });
}

// DELETE /api/vendor/employees/:id — Remove employee from vendor
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const { data: memberships } = await db
    .from('user_vendor_roles')
    .select('vendor_id')
    .eq('id', id)
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  if (!isSuperAdmin(profile)) {
    const forbidden = await requireVendorAdmin(profile.id, membership.vendor_id);
    if (forbidden) return forbidden;
  }

  const { error: dbError } = await db
    .from('user_vendor_roles')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Employee removed from vendor' });
}
