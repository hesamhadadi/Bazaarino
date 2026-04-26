import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleBySlug } from '@/lib/articles';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const item = await fetchArticleBySlug(params.slug);
  if (!item) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  return NextResponse.json({ item });
}
