import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

export async function GET() {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();
    const banners = await Banner.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      imageUrlMobile,
      linkUrl,
      startsAt,
      endsAt,
      placement,
      size,
      priority,
      categoryId,
      isActive,
    } = body;
    if (!imageUrl || !startsAt || !endsAt) {
      return NextResponse.json({ message: 'فیلدهای الزامی را پر کنید' }, { status: 400 });
    }
    if (placement === 'category' && !categoryId) {
      return NextResponse.json({ message: 'برای بنر دسته‌بندی، انتخاب دسته الزامی است' }, { status: 400 });
    }

    await connectDB();
    const banner = await Banner.create({
      title,
      description,
      imageUrl,
      imageUrlMobile,
      linkUrl,
      placement: placement || 'home',
      size: size || 'hero',
      priority: typeof priority === 'number' ? priority : 0,
      categoryId: placement === 'category' ? categoryId : undefined,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      isActive: isActive !== false,
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ message: 'id الزامی است' }, { status: 400 });

    await connectDB();
    const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ banner });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'id الزامی است' }, { status: 400 });

    await connectDB();
    await Banner.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
