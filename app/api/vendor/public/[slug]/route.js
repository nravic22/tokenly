import { supabaseAdmin, supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/vendor/public/:slug — Public endpoint, no auth required
export async function GET(request, context) {
  try {
    const { slug } = context.params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: vendors, error } = await db
      .from('vendors')
      .select('id, name, slug, logo_url, is_active')
      .eq('slug', slug)
      .limit(1);

    if (error) {
      console.error('Vendor public lookup error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!vendors || vendors.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = vendors[0];

    if (!vendor.is_active) {
      return NextResponse.json({ error: 'This organization is currently suspended' }, { status: 403 });
    }

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        logo_url: vendor.logo_url,
      },
    });
  } catch (err) {
    console.error('Vendor public exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
