import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SavedSearch from '@/models/SavedSearch';
import { resolveSessionUserId } from '@/lib/session-user';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

function normalizeQuery(query: string): string {
  try {
    const q = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
    const entries = Array.from(q.entries())
      .filter(([k, v]) => v && v !== 'all' && !['page'].includes(k))
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}=${v}`).join('&');
  } catch {
    return query;
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    await connectDB();
    const items = await SavedSearch.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body.query === 'string' ? body.query : '';
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : 'جست‌وجوی من';
    const alertEnabled = Boolean(body.alertEnabled);
    const normalized = normalizeQuery(rawQuery);
    if (!normalized) {
      return NextResponse.json({ message: 'فیلتری برای ذخیره وجود ندارد' }, { status: 400 });
    }

    const params: Record<string, string> = {};
    new URLSearchParams(normalized).forEach((v, k) => { params[k] = v; });

    await connectDB();
    try {
      const item = await SavedSearch.create({
        userId,
        name,
        query: normalized,
        params,
        alertEnabled,
      });
      return NextResponse.json({ item: JSON.parse(JSON.stringify(item)) }, { status: 201 });
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json({ message: 'این جست‌وجو قبلاً ذخیره شده است' }, { status: 409 });
      }
      throw e;
    }
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
