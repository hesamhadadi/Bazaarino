import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';

export const dynamic = 'force-dynamic';

/**
 * Public read-only catalog. The home page / profile page / ad page all
 * call this once and then resolve badge slugs locally — keeps display
 * cheap even when many users have many badges.
 */
export async function GET() {
  await connectDB();
  const badges = await Badge.find({ isPublic: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return NextResponse.json({ badges });
}
