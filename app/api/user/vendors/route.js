import { getAuthUser, getUserVendors } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/user/vendors — List all vendor memberships for the logged-in user
export async function GET(request) {
  const { profile, error } = await getAuthUser(request);
  if (error) return error;

  const vendors = await getUserVendors(profile.id);

  return NextResponse.json({ vendors });
}
