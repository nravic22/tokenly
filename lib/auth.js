import { supabaseAdmin, supabase } from './supabase';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

/**
 * Extract and verify the current user from the Authorization header.
 */
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, name, email, platform_role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) };
  }

  return { user, profile };
}

export function isSuperAdmin(profile) {
  return profile.platform_role === 'super_admin';
}

export async function isVendorAdmin(userId, vendorId) {
  const { data } = await db
    .from('user_vendor_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .eq('role', 'vendor_admin')
    .eq('is_active', true)
    .single();

  return !!data;
}

export async function isVendorActive(vendorId) {
  const { data } = await db
    .from('vendors')
    .select('is_active')
    .eq('id', vendorId)
    .single();

  return data?.is_active === true;
}

/**
 * Get all active vendor memberships for a user (filters out blocked vendors).
 */
export async function getUserVendors(userId) {
  const { data, error } = await db
    .from('user_vendor_roles')
    .select(`
      id,
      role,
      vendor:vendors (
        id,
        name,
        logo_url,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) return [];

  return data
    .filter(m => m.vendor?.is_active === true)
    .map(m => ({
      membership_id: m.id,
      role: m.role,
      vendor_id: m.vendor.id,
      vendor_name: m.vendor.name,
      vendor_logo: m.vendor.logo_url,
    }));
}

export function requireSuperAdmin(profile) {
  if (!isSuperAdmin(profile)) {
    return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
  }
  return null;
}

export async function requireVendorAdmin(userId, vendorId) {
  const vendorActive = await isVendorActive(vendorId);
  if (!vendorActive) {
    return NextResponse.json({ error: 'Vendor is suspended' }, { status: 403 });
  }

  const isAdmin = await isVendorAdmin(userId, vendorId);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Vendor Admin access required' }, { status: 403 });
  }
  return null;
}
