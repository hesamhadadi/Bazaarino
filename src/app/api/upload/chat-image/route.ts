import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().toLowerCase();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: 'تنظیمات Cloudinary ناقص است' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ message: 'فایلی انتخاب نشده' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: 'فرمت تصویر مجاز نیست' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'حجم فایل بیش از حد مجاز است' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'bazaarino/chat',
      transformation: [
        { width: 1400, height: 1400, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
