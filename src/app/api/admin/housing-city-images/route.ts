import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HousingCityImage from '@/models/HousingCityImage';

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
    const items = await HousingCityImage.find().sort({ city: 1 }).lean();
    return NextResponse.json({ items });
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
    const { city, imageUrl, title } = body;
    if (!city || !imageUrl) {
      return NextResponse.json({ message: 'شهر و تصویر الزامی است' }, { status: 400 });
    }

    await connectDB();
    const item = await HousingCityImage.findOneAndUpdate(
      { city },
      { city, imageUrl, title, isActive: true },
      { upsert: true, new: true }
    );

    return NextResponse.json({ item }, { status: 201 });
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
    const item = await HousingCityImage.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ item });
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
    await HousingCityImage.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
