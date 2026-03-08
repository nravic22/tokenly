import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, isSuperAdmin, requireVendorAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/vendor/employees?vendor_id=xxx — List employees of a vendor
export async function GET(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const vendorId = request.nextUrl.searchParams.get('vendor_id');
  if (!vendorId) {
    return NextResponse.json({ error: 'vendor_id is required' }, { status: 400 });
  }

  // Super admins can view any vendor's employees
  if (!isSuperAdmin(profile)) {
    const forbidden = await requireVendorAdmin(profile.id, vendorId);
    if (forbidden) return forbidden;
  }

  const { data: members, error: dbError } = await db
    .from('user_vendor_roles')
    .select(`
      id,
      role,
      is_active,
      created_at,
      user:profiles (
        id, name, email, avatar, role, dept
      )
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }

  return NextResponse.json({ employees: members || [] });
}

// POST /api/vendor/employees — Add an employee to a vendor
export async function POST(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const { vendor_id, user_id, role } = await request.json();

  if (!vendor_id || !user_id) {
    return NextResponse.json({ error: 'vendor_id and user_id are required' }, { status: 400 });
  }

  // Super admins can add to any vendor
  if (!isSuperAdmin(profile)) {
    const forbidden = await requireVendorAdmin(profile.id, vendor_id);
    if (forbidden) return forbidden;
  }

  const memberRole = role === 'vendor_admin' ? 'vendor_admin' : 'employee';

  const { data: membership, error: dbError } = await db
    .from('user_vendor_roles')
    .upsert(
      { user_id, vendor_id, role: memberRole, is_active: true },
      { onConflict: 'user_id,vendor_id' }
    )
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: 'Failed to add employee' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Employee added', membership }, { status: 201 });
}
