import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { resolveSessionUserId } from '@/lib/session-user';
import { computeHousingNearby } from '@/lib/map-data';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const ad = await Ad.findById(params.id).populate('userId', 'name avatar phone email city createdAt role').lean();

    if (!ad) {
      return NextResponse.json({ message: 'آگهی یافت نشد' }, { status: 404 });
    }

    // Increment views
    await Ad.findByIdAndUpdate(params.id, { $inc: { views: 1 } });

    return NextResponse.json({ ad });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد، لطفاً دوباره وارد شوید' }, { status: 401 });

    const ad = await Ad.findById(params.id);
    if (!ad) return NextResponse.json({ message: 'آگهی یافت نشد' }, { status: 404 });

    const isOwner = ad.userId.toString() === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();

    // Admin can change status / featured flags
    if (isAdmin && body.status) {
      ad.status = body.status;
      if (body.rejectionReason) ad.rejectionReason = body.rejectionReason;
    }
    if (isAdmin && body.isFeatured !== undefined) {
      ad.isFeatured = body.isFeatured;
      if (body.isFeatured) {
        ad.featuredUntil = body.featuredUntil ? new Date(body.featuredUntil) : undefined;
      } else {
        ad.featuredUntil = undefined;
      }
    }

    // Owner can update content
    if (isOwner) {
      const allowedFields = ['title', 'description', 'price', 'priceType', 'city', 'phone', 'email', 'showPhone', 'showEmail', 'images', 'housing'];
      allowedFields.forEach(field => {
        if (body[field] !== undefined) (ad as any)[field] = body[field];
      });
      if (body.housing && ad.category === 'real-estate') {
        const location = body.housing?.location?.lat !== undefined && body.housing?.location?.lng !== undefined
          ? { lat: Number(body.housing.location.lat), lng: Number(body.housing.location.lng) }
          : null;
        const city = body.city || ad.city;
        (ad as any).housing.nearby = computeHousingNearby(city, location);
      }
      // Reset to pending when owner edits
      if (!isAdmin) ad.status = 'pending';
    }

    await ad.save();

    return NextResponse.json({ message: 'آگهی بروزرسانی شد', ad });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد، لطفاً دوباره وارد شوید' }, { status: 401 });

    const ad = await Ad.findById(params.id);
    if (!ad) return NextResponse.json({ message: 'آگهی یافت نشد' }, { status: 404 });

    const isOwner = ad.userId.toString() === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await Ad.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'آگهی حذف شد' });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
