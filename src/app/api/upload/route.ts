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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: 'تنظیمات Cloudinary ناقص است' }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json({ message: 'فایلی انتخاب نشده' }, { status: 400 });
    }

    if (files.length > 8) {
      return NextResponse.json({ message: 'حداکثر ۸ تصویر مجاز است' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: 'bazaarino/ads',
        transformation: [
          { width: 1200, height: 900, crop: 'limit' },
          { quality: 'auto:good' },
          { format: 'webp' },
        ],
      });

      return result.secure_url;
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
