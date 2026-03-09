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
    const items = await Article.find({ status: 'published' })
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
    const { title, excerpt, content, coverImage, tags, isHot, status } = body;
    if (!title || !excerpt || !content) {
      return NextResponse.json({ message: 'عنوان، خلاصه و متن الزامی است' }, { status: 400 });
    }

    await connectDB();
    const authorId = await resolveSessionUserId(session.user);
    if (!authorId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    let slug = slugify(title);
    let counter = 1;
    while (await Article.exists({ slug })) {
      slug = `${slugify(title)}-${counter++}`;
    }

    const article = await Article.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags: Array.isArray(tags) ? tags : [],
      isHot: Boolean(isHot),
      status: status === 'draft' ? 'draft' : 'published',
      authorId,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
