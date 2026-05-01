import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { resolveSessionUserId } from '@/lib/session-user';
import { computeHousingNearby } from '@/lib/map-data';
import { updateAdStatusAndNotifyOwner } from '@/lib/ad-moderation';
import { normalizeProducts } from '@/lib/ad-products';

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
    if (isAdmin && (body.status === 'approved' || body.status === 'rejected')) {
      await updateAdStatusAndNotifyOwner(params.id, body.status, body.rejectionReason);
      if (body.status === 'approved') {
        ad.rejectionReason = undefined;
      } else if (body.rejectionReason) {
        ad.rejectionReason = body.rejectionReason;
      }
      ad.status = body.status;
    }
    if (isAdmin && body.isFeatured !== undefined) {
      ad.isFeatured = body.isFeatured;
      if (body.isFeatured) {
        ad.featuredUntil = body.featuredUntil ? new Date(body.featuredUntil) : undefined;
      } else {
        ad.featuredUntil = undefined;
      }
    }
    if (isAdmin && body.isUrgent !== undefined) {
      ad.isUrgent = body.isUrgent === true;
    }

    // Owner can update content
    if (isOwner) {
      // category/subcategory are owner-editable so the seller can correct
      // a wrong choice without re-creating the ad. Image array is fully
      // owner-controlled (replace, reorder, prune) — the client always
      // sends the canonical list.
      const allowedFields = [
        'title',
        'description',
        'category',
        'subcategory',
        'price',
        'priceType',
        'city',
        'phone',
        'email',
        'showPhone',
        'showEmail',
        'images',
        'housing',
        'listingMode',
      ];
      allowedFields.forEach(field => {
        if (body[field] !== undefined) (ad as any)[field] = body[field];
      });
      if (body.housing && ad.category === 'real-estate') {
        const preferredAgeMinNum = body.housing?.preferredAgeMin !== undefined && body.housing?.preferredAgeMin !== null && body.housing?.preferredAgeMin !== ''
          ? Number(body.housing.preferredAgeMin)
          : undefined;
        const preferredAgeMaxNum = body.housing?.preferredAgeMax !== undefined && body.housing?.preferredAgeMax !== null && body.housing?.preferredAgeMax !== ''
          ? Number(body.housing.preferredAgeMax)
          : undefined;
        const normalizedAgeRange = preferredAgeMinNum !== undefined && preferredAgeMaxNum !== undefined
          ? {
              min: Math.min(preferredAgeMinNum, preferredAgeMaxNum),
              max: Math.max(preferredAgeMinNum, preferredAgeMaxNum),
            }
          : { min: preferredAgeMinNum, max: preferredAgeMaxNum };
        const availabilityStartDate = body.housing?.availabilityStartDate ? new Date(body.housing.availabilityStartDate) : null;
        const location = body.housing?.location?.lat !== undefined && body.housing?.location?.lng !== undefined
          ? { lat: Number(body.housing.location.lat), lng: Number(body.housing.location.lng) }
          : null;
        const city = body.city || ad.city;
        if (!(ad as any).housing) (ad as any).housing = {};
        (ad as any).housing.deposit = body.housing?.deposit !== undefined && body.housing?.deposit !== null && body.housing?.deposit !== ''
          ? Number(body.housing.deposit)
          : undefined;
        (ad as any).housing.residenceEligible = body.housing?.residenceEligible === true;
        (ad as any).housing.preferredGender = body.housing?.preferredGender || 'any';
        (ad as any).housing.preferredAgeMin = normalizedAgeRange.min;
        (ad as any).housing.preferredAgeMax = normalizedAgeRange.max;
        (ad as any).housing.preferredUniversity = body.housing?.preferredUniversity ? String(body.housing.preferredUniversity).trim() : undefined;
        (ad as any).housing.roommatesCount = body.housing?.roommatesCount !== undefined && body.housing?.roommatesCount !== null && body.housing?.roommatesCount !== ''
          ? Number(body.housing.roommatesCount)
          : undefined;
        (ad as any).housing.availabilityStartDate = availabilityStartDate && !isNaN(availabilityStartDate.getTime()) ? availabilityStartDate : undefined;
        (ad as any).housing.billsInfo = ['included', 'not-included', 'partial'].includes(body.housing?.billsInfo) ? body.housing.billsInfo : undefined;
        (ad as any).housing.agencyFee = body.housing?.agencyFee !== undefined && body.housing?.agencyFee !== null && body.housing?.agencyFee !== ''
          ? Number(body.housing.agencyFee)
          : undefined;
        (ad as any).housing.isAllInclusivePrice = body.housing?.isAllInclusivePrice === true;
        (ad as any).housing.address = body.housing?.address || undefined;
        (ad as any).housing.location = location || undefined;
        (ad as any).housing.nearby = computeHousingNearby(city, location);
      }
      if (body.listingMode !== undefined) {
        (ad as any).listingMode = body.listingMode === 'request' ? 'request' : 'offer';
      }
      if (body.bump === true) {
        (ad as any).bumpedAt = new Date();
        (ad as any).bumpCount = Number((ad as any).bumpCount || 0) + 1;
      }
      // Multi-product catalog: if products[] is supplied, normalize and
      // replace the array (sending [] clears the catalog). The top-level
      // price is realigned to the cheapest product so search keeps working.
      if (body.products !== undefined) {
        const { products: cleanProducts, derivedPrice, error } =
          normalizeProducts(body.products);
        if (error) {
          return NextResponse.json({ message: error }, { status: 400 });
        }
        (ad as any).products = cleanProducts;
        if (cleanProducts && cleanProducts.length > 0) {
          (ad as any).price = derivedPrice;
        }
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
