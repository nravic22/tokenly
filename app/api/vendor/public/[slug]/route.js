import { supabaseAdmin, supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const db = supabaseAdmin || supabase;

// GET /api/vendor/public/:slug — Public endpoint, no auth required
// Returns vendor branding (name, logo, slug) for the sign-in page
export async function GET(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: vendor, error } = await db
    .from('vendors')
    .select('id, name, slug, logo_url, is_active')
    .eq('slug', slug)
    .single();

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

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
}
