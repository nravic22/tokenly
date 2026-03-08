import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthUser, requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/admin/vendors — List all vendors (Super Admin only)
export async function GET(request) {
  try {
    const { profile, error } = await getAuthUser(request);
    if (error) return error;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const { data: vendors, error: dbError } = await db
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Fetch vendors error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error('Vendors GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/vendors — Create a new vendor (Super Admin only)
export async function POST(request) {
  try {
    const { profile, error } = await getAuthUser(request);
    if (error) return error;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const { name, logo_url, slug: customSlug } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    // Auto-generate slug from name, or use custom slug
    const slug = (customSlug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const { data: vendor, error: dbError } = await db
      .from('vendors')
      .insert({ name, logo_url: logo_url || null, slug })
      .select()
      .single();

    if (dbError) {
      console.error('Create vendor error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vendor created', vendor }, { status: 201 });
  } catch (err) {
    console.error('Vendors POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
