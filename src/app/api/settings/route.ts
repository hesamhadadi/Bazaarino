import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

export async function GET() {
  try {
    await connectDB();
    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    return NextResponse.json(
      { settings: { brandPrimary: normalizeBrandPrimary(settings?.brandPrimary || DEFAULT_BRAND_PRIMARY) } },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch {
    return NextResponse.json(
      { settings: { brandPrimary: DEFAULT_BRAND_PRIMARY } },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  }
}
