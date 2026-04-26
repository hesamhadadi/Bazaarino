import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import { resolveSessionUserId } from '@/lib/session-user';
import { slugify } from '@/lib/slug';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 12);
    const q = searchParams.get('q')?.trim();
    const tag = searchParams.get('tag')?.trim();
    const statusFilter = searchParams.get('status'); // 'all' | 'draft' | 'published'

    // Privileged users can request drafts / all.
    const session = await getServerSession(authOptions);
    const isPrivileged = ['admin', 'editor'].includes(session?.user?.role || '');

    const query: any = {};
    if (isPrivileged && statusFilter === 'all') {
      // no status restriction
    } else if (
      isPrivileged &&
      (statusFilter === 'draft' || statusFilter === 'published' || statusFilter === 'scheduled')
    ) {
      query.status = statusFilter;
    } else {
      query.status = 'published';
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ];
    }
    if (tag) query.tags = tag;

    const items = await Article.find(query)
      .populate('authorId', 'name avatar role')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!['admin', 'editor'].includes(session.user.role)) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { title, excerpt, content, coverImage, tags, isHot, status, scheduledFor, slug: rawSlug } = body;
    if (!title || !excerpt || !content) {
      return NextResponse.json({ message: 'عنوان، خلاصه و متن الزامی است' }, { status: 400 });
    }

    await connectDB();
    const authorId = await resolveSessionUserId(session.user);
    if (!authorId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    // If the editor supplied an explicit slug, use it (after normalising
    // through slugify so we can't end up with anything URL-unsafe). Else
    // fall back to deriving one from the title. Either way, ensure
    // uniqueness by suffixing -2/-3/... until free.
    const baseSlug =
      typeof rawSlug === 'string' && rawSlug.trim()
        ? slugify(rawSlug.trim())
        : slugify(title);
    if (!baseSlug) {
      return NextResponse.json(
        { message: 'نشانی (slug) معتبر نیست' },
        { status: 400 },
      );
    }
    let slug = baseSlug;
    let counter = 1;
    while (await Article.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Resolve final status + dates.
    // - draft       → no publish date
    // - scheduled   → must have future scheduledFor
    // - published   → set publishedAt now
    let finalStatus: 'draft' | 'scheduled' | 'published' = 'published';
    let resolvedSchedule: Date | undefined;
    let resolvedPublishedAt: Date | undefined;
    const now = new Date();

    if (status === 'draft') {
      finalStatus = 'draft';
    } else if (status === 'scheduled' && scheduledFor) {
      const dt = new Date(scheduledFor);
      if (!Number.isNaN(dt.getTime()) && dt.getTime() > now.getTime()) {
        finalStatus = 'scheduled';
        resolvedSchedule = dt;
      } else {
        finalStatus = 'published';
        resolvedPublishedAt = now;
      }
    } else {
      finalStatus = 'published';
      resolvedPublishedAt = now;
    }

    const article = await Article.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags: Array.isArray(tags) ? tags : [],
      isHot: Boolean(isHot),
      status: finalStatus,
      scheduledFor: resolvedSchedule,
      publishedAt: resolvedPublishedAt,
      authorId,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
