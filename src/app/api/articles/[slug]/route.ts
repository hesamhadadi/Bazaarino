import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import { fetchArticleBySlug } from '@/lib/articles';
import { slugify } from '@/lib/slug';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  // Admin can fetch by slug or _id, including drafts.
  const session = await getServerSession(authOptions);
  const isPrivileged = ['admin', 'editor'].includes(session?.user?.role || '');

  if (isPrivileged) {
    try {
      await connectDB();
      const candidates: any = { slug: params.slug.toLowerCase().trim() };
      let item = await Article.findOne(candidates)
        .populate('authorId', 'name avatar role')
        .lean();
      if (!item && mongoose.Types.ObjectId.isValid(params.slug)) {
        item = await Article.findById(params.slug)
          .populate('authorId', 'name avatar role')
          .lean();
      }
      if (!item) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
      return NextResponse.json({ item: JSON.parse(JSON.stringify(item)) });
    } catch (err) {
      console.error('[articles GET admin]', err);
      return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
    }
  }

  const item = await fetchArticleBySlug(params.slug);
  if (!item) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!['admin', 'editor'].includes(session.user.role)) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();

    const article = await Article.findOne({ slug: params.slug.toLowerCase().trim() });
    if (!article) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    const body = await request.json();
    const { title, excerpt, content, coverImage, tags, isHot, status, scheduledFor } = body;

    if (typeof title === 'string' && title.trim()) {
      // If title changed, regenerate slug uniquely.
      if (title.trim() !== article.title) {
        let nextSlug = slugify(title);
        let counter = 1;
        while (await Article.exists({ slug: nextSlug, _id: { $ne: article._id } })) {
          nextSlug = `${slugify(title)}-${counter++}`;
        }
        article.slug = nextSlug;
        article.title = title.trim();
      }
    }

    if (typeof excerpt === 'string') article.excerpt = excerpt;
    if (typeof content === 'string') article.content = content;
    if (typeof coverImage === 'string' || coverImage === null) {
      article.coverImage = coverImage || undefined;
    }
    if (Array.isArray(tags)) {
      article.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof isHot === 'boolean') article.isHot = isHot;

    // Status + scheduling state machine.
    const now = new Date();
    if (status === 'draft' || status === 'published' || status === 'scheduled') {
      if (status === 'draft') {
        article.status = 'draft';
        article.scheduledFor = undefined;
      } else if (status === 'scheduled') {
        const dt = scheduledFor ? new Date(scheduledFor) : null;
        if (dt && !Number.isNaN(dt.getTime()) && dt.getTime() > now.getTime()) {
          article.status = 'scheduled';
          article.scheduledFor = dt;
        } else {
          // Invalid future date → publish now.
          article.status = 'published';
          article.scheduledFor = undefined;
          if (!article.publishedAt) article.publishedAt = now;
        }
      } else {
        // published
        article.status = 'published';
        article.scheduledFor = undefined;
        if (!article.publishedAt) article.publishedAt = now;
      }
    } else if (typeof scheduledFor !== 'undefined' && article.status === 'scheduled') {
      // Caller is updating only the scheduled date.
      const dt = scheduledFor ? new Date(scheduledFor) : null;
      if (dt && !Number.isNaN(dt.getTime())) article.scheduledFor = dt;
    }

    await article.save();

    return NextResponse.json({ item: JSON.parse(JSON.stringify(article)) });
  } catch (err) {
    console.error('[articles PATCH]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();
    const result = await Article.findOneAndDelete({
      slug: params.slug.toLowerCase().trim(),
    });
    if (!result) {
      // Fallback by id
      if (mongoose.Types.ObjectId.isValid(params.slug)) {
        await Article.findByIdAndDelete(params.slug);
      } else {
        return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[articles DELETE]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
