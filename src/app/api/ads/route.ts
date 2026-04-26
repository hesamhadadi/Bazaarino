import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { resolveSessionUserId } from '@/lib/session-user';
import { computeHousingNearby } from '@/lib/map-data';
import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram';
import { getAppUrl } from '@/lib/app-url';
import Setting from '@/models/Setting';
import { getAppSettings } from '@/lib/settings';
import { getCityLabel, getCategoryById, getCountryByCity } from '@/lib/constants';
import { attachMarketPriceToAds } from '@/lib/market-price';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const q = searchParams.get('q');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const priceType = searchParams.get('priceType');
    const hasImage = searchParams.get('hasImage');
    const sort = searchParams.get('sort') || 'newest';
    const residence = searchParams.get('residence');
    const listingMode = searchParams.get('listingMode');
    const billsInfo = searchParams.get('billsInfo');
    const hasAgencyFee = searchParams.get('hasAgencyFee');
    const allInclusive = searchParams.get('allInclusive');
    const availabilityFrom = searchParams.get('availabilityFrom');
    const preferredGender = searchParams.get('preferredGender');
    const preferredUniversity = searchParams.get('preferredUniversity');
    const preferredAgeMin = searchParams.get('preferredAgeMin');
    const preferredAgeMax = searchParams.get('preferredAgeMax');
    const status = searchParams.get('status') || 'approved';

    const query: any = { status };

    if (country) query.country = country;
    if (city) query.city = city;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (featured === 'true') {
      const now = new Date();
      query.isFeatured = true;
      query.$and = [...(query.$and || []), { $or: [{ featuredUntil: { $exists: false } }, { featuredUntil: { $gte: now } }] }];
    }
    if (priceType) query.priceType = priceType;
    if (hasImage === 'true') query.images = { $exists: true, $ne: [] };
    if (residence === 'yes') query['housing.residenceEligible'] = true;
    if (residence === 'no') query['housing.residenceEligible'] = { $ne: true };
    if (listingMode === 'offer' || listingMode === 'request') query.listingMode = listingMode;
    if (billsInfo === 'included' || billsInfo === 'not-included' || billsInfo === 'partial') query['housing.billsInfo'] = billsInfo;
    if (hasAgencyFee === 'yes') query['housing.agencyFee'] = { $gt: 0 };
    if (hasAgencyFee === 'no') {
      query.$and = [...(query.$and || []), { $or: [{ 'housing.agencyFee': { $exists: false } }, { 'housing.agencyFee': { $lte: 0 } }] }];
    }
    if (allInclusive === 'yes') query['housing.isAllInclusivePrice'] = true;
    if (allInclusive === 'no') query['housing.isAllInclusivePrice'] = { $ne: true };
    if (preferredGender === 'male' || preferredGender === 'female' || preferredGender === 'any') query['housing.preferredGender'] = preferredGender;
    if (preferredUniversity) query['housing.preferredUniversity'] = { $regex: preferredUniversity, $options: 'i' };
    if (preferredAgeMin || preferredAgeMax) {
      if (preferredAgeMin) query.$and = [...(query.$and || []), { 'housing.preferredAgeMin': { $lte: Number(preferredAgeMin) } }];
      if (preferredAgeMax) query.$and = [...(query.$and || []), { 'housing.preferredAgeMax': { $gte: Number(preferredAgeMax) } }];
    }
    if (availabilityFrom) {
      const fromDate = new Date(availabilityFrom);
      if (!isNaN(fromDate.getTime())) query['housing.availabilityStartDate'] = { $gte: fromDate };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (q) query.$text = { $search: q };

    const skip = (page - 1) * limit;
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { isUrgent: -1, isFeatured: -1, bumpedAt: -1, createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1, createdAt: -1 },
      priceDesc: { price: -1, createdAt: -1 },
      popular: { views: -1, createdAt: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const [ads, total] = await Promise.all([
      Ad.find(query)
        .populate('userId', 'name avatar phone role')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ad.countDocuments(query),
    ]);

    const adsWithMarketPrice = await attachMarketPriceToAds(ads as any[]);

    return NextResponse.json({
      ads: adsWithMarketPrice,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get ads error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, price, priceType, currency,
      category, subcategory, city, country, images,
      phone, email, showPhone, showEmail,
      listingMode,
      isUrgent,
      housing,
    } = body;

    if (!title || !description || !category || !subcategory || !city) {
      return NextResponse.json({ message: 'فیلدهای الزامی را پر کنید' }, { status: 400 });
    }

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: 'کاربر معتبر یافت نشد، لطفاً دوباره وارد شوید' }, { status: 401 });
    }

    // Per-user ad-count limit (admins/editors are exempt)
    const appSettings = await getAppSettings();
    const isPrivileged = session.user.role === 'admin' || session.user.role === 'editor';
    if (!isPrivileged && appSettings.maxAdsPerUser > 0) {
      const userAdCount = await Ad.countDocuments({
        userId,
        status: { $in: ['pending', 'approved'] },
      });
      if (userAdCount >= appSettings.maxAdsPerUser) {
        return NextResponse.json(
          {
            message: `سقف تعداد آگهی فعال شما (${appSettings.maxAdsPerUser} آگهی) پر است. ابتدا یک آگهی قدیمی را حذف یا به‌فروش‌رفته علامت بزنید.`,
          },
          { status: 400 }
        );
      }
    }

    const preferredAgeMinNum = housing?.preferredAgeMin !== undefined && housing?.preferredAgeMin !== null && housing?.preferredAgeMin !== ''
      ? Number(housing.preferredAgeMin)
      : undefined;
    const preferredAgeMaxNum = housing?.preferredAgeMax !== undefined && housing?.preferredAgeMax !== null && housing?.preferredAgeMax !== ''
      ? Number(housing.preferredAgeMax)
      : undefined;
    const normalizedAgeRange = preferredAgeMinNum !== undefined && preferredAgeMaxNum !== undefined
      ? {
          min: Math.min(preferredAgeMinNum, preferredAgeMaxNum),
          max: Math.max(preferredAgeMinNum, preferredAgeMaxNum),
        }
      : { min: preferredAgeMinNum, max: preferredAgeMaxNum };

    const housingPayload = category === 'real-estate' ? {
      deposit: housing?.deposit ? Number(housing.deposit) : undefined,
      residenceEligible: housing?.residenceEligible === true,
      preferredGender: housing?.preferredGender || 'any',
      preferredAgeMin: normalizedAgeRange.min,
      preferredAgeMax: normalizedAgeRange.max,
      preferredUniversity: housing?.preferredUniversity ? String(housing.preferredUniversity).trim() : undefined,
      roommatesCount: housing?.roommatesCount !== undefined && housing?.roommatesCount !== null
        ? Number(housing.roommatesCount)
        : undefined,
      availabilityStartDate: housing?.availabilityStartDate ? new Date(housing.availabilityStartDate) : undefined,
      billsInfo: ['included', 'not-included', 'partial'].includes(housing?.billsInfo) ? housing.billsInfo : undefined,
      agencyFee: housing?.agencyFee !== undefined && housing?.agencyFee !== null && housing?.agencyFee !== ''
        ? Number(housing.agencyFee)
        : undefined,
      isAllInclusivePrice: housing?.isAllInclusivePrice === true,
      address: housing?.address || undefined,
      location: housing?.location?.lat !== undefined && housing?.location?.lng !== undefined
        ? { lat: Number(housing.location.lat), lng: Number(housing.location.lng) }
        : undefined,
    } : undefined;

    const nearby = category === 'real-estate' && housingPayload?.location
      ? computeHousingNearby(city, housingPayload.location)
      : [];

    const resolvedCountry = country || getCountryByCity(city) || 'italy';

    const ad = await Ad.create({
      title,
      description,
      price: price ? parseFloat(price) : undefined,
      priceType: priceType || 'fixed',
      currency: currency || 'EUR',
      category,
      subcategory,
      country: resolvedCountry,
      city,
      images: images || [],
      phone,
      email,
      showPhone: showPhone !== false,
      showEmail: showEmail === true,
      listingMode: listingMode === 'request' ? 'request' : 'offer',
      isUrgent: isUrgent === true,
      bumpedAt: new Date(),
      housing: housingPayload ? { ...housingPayload, nearby } : undefined,
      userId,
      status: appSettings.adAutoApprove || isPrivileged ? 'approved' : 'pending',
    });

    try {
      const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
      const appUrl = (settings?.siteUrl || getAppUrl()).replace(/\/$/, '');
      const cityLabel = getCityLabel(city) || city;
      const categoryLabel = getCategoryById(category)?.label || category;
      const priceLabel = priceType === 'free' ? 'رایگان' : priceType === 'negotiable' ? 'توافقی' : price ? `€${price}` : 'توافقی';
      const descSnippet = description ? `${String(description).slice(0, 140)}${String(description).length > 140 ? '…' : ''}` : '';
      const ownerName = session?.user?.name ? String(session.user.name) : 'کاربر';
      const caption = `🆕 <b>آگهی جدید</b>\n\n🏷️ <b>عنوان:</b> ${title}\n📍 <b>شهر:</b> ${cityLabel}\n📦 <b>دسته:</b> ${categoryLabel}\n💶 <b>قیمت:</b> ${priceLabel}\n👤 <b>ثبت‌کننده:</b> ${ownerName}\n${descSnippet ? `\n📝 <b>توضیحات:</b> ${descSnippet}\n` : '\n'}برای بررسی اقدام کنید.`;
      const keyboard = [
        [
          { text: '✅ تأیید', callback_data: `approve:${ad._id}` },
          { text: '❌ رد', callback_data: `reject:${ad._id}` },
        ],
        [{ text: '🔗 مشاهده آگهی', url: `${appUrl}/ads/${ad._id}` }],
      ];

      const imageUrl = images?.[0];
      if (imageUrl) {
        await sendTelegramPhoto(imageUrl, caption, { inlineKeyboard: keyboard });
      } else {
        await sendTelegramMessage(caption, { inlineKeyboard: keyboard });
      }
    } catch {}

    const successMessage = appSettings.adAutoApprove || isPrivileged
      ? 'آگهی با موفقیت ثبت و منتشر شد'
      : 'آگهی با موفقیت ثبت شد و در انتظار تأیید است';
    return NextResponse.json({ message: successMessage, ad }, { status: 201 });
  } catch (error: any) {
    console.error('Create ad error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
