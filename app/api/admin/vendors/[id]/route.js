import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/admin/vendors/:id — Get vendor details + employees
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { profile, error } = await getAuthUser(request);
    if (error) return error;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const { data: rows, error: vendorError } = await db
      .from('vendors')
      .select('*')
      .eq('id', id)
      .limit(1);

    const vendor = rows?.[0];
    if (vendorError || !vendor) {
      return NextResponse.json({ error: vendorError?.message || 'Vendor not found' }, { status: 404 });
    }

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
  } catch (err) {
    console.error('Vendor GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/vendors/:id — Update vendor (name, logo, slug, block/unblock)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { profile, error } = await getAuthUser(request);
    if (error) return error;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const body = await request.json();
    const updates = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: rows, error: dbError } = await db
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select();

    const vendor = rows?.[0];

    if (dbError) {
      console.error('Update vendor error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: updates.is_active === false ? 'Vendor blocked' : 'Vendor updated',
      vendor,
    });
  } catch (err) {
    console.error('Vendor PATCH exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/vendors/:id — Soft delete (block) a vendor
export async function DELETE(request, { params }) {
  try {
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
      console.error('Delete vendor error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vendor blocked successfully' });
  } catch (err) {
    console.error('Vendor DELETE exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
