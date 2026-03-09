import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const item = await Article.findOne({ slug: params.slug, status: 'published' })
      .populate('authorId', 'name avatar role')
      .lean();
    if (!item) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
    return NextResponse.json({ item: JSON.parse(JSON.stringify(item)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
