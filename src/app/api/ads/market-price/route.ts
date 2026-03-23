import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getMarketPriceSnapshot } from '@/lib/market-price';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || undefined;

    if (!city || !category) {
      return NextResponse.json({ marketPrice: null });
    }

    await connectDB();
    const marketPrice = await getMarketPriceSnapshot({ city, category, subcategory });
    return NextResponse.json({ marketPrice });
  } catch (error) {
    return NextResponse.json({ marketPrice: null }, { status: 200 });
  }
}
