import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    await connectDB();
    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    return NextResponse.json(
      {
        settings: {
          brandPrimary: normalizeBrandPrimary(settings?.brandPrimary || DEFAULT_BRAND_PRIMARY),
          updatedAt: settings?.updatedAt ? new Date(settings.updatedAt).toISOString() : null,
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { settings: { brandPrimary: DEFAULT_BRAND_PRIMARY, updatedAt: null }, fallback: true },
      { headers: NO_STORE_HEADERS }
    );
  }
}
