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

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const videoFiles = files.filter((file) => file.type.startsWith('video/'));
    const unsupportedFiles = files.filter((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'));

    if (unsupportedFiles.length > 0) {
      return NextResponse.json({ message: 'فقط تصویر یا ویدیو مجاز است' }, { status: 400 });
    }

    if (imageFiles.length > 8) {
      return NextResponse.json({ message: 'حداکثر ۸ تصویر مجاز است' }, { status: 400 });
    }

    if (videoFiles.length > 1) {
      return NextResponse.json({ message: 'حداکثر ۱ ویدیو مجاز است' }, { status: 400 });
    }

    const maxVideoSize = 10 * 1024 * 1024;
    const oversizedVideo = videoFiles.find((file) => file.size > maxVideoSize);
    if (oversizedVideo) {
      return NextResponse.json({ message: 'حجم ویدیو باید کمتر از ۱۰ مگابایت باشد' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const isVideo = file.type.startsWith('video/');
      const result = await cloudinary.uploader.upload(base64, isVideo
        ? {
            folder: 'bazaarino/ads/videos',
            resource_type: 'video',
          }
        : {
            folder: 'bazaarino/ads',
            transformation: [
              { width: 1200, height: 900, crop: 'limit' },
              { quality: 'auto:good' },
              { format: 'webp' },
            ],
          });

      return { url: result.secure_url, isVideo };
    });

    const uploaded = await Promise.all(uploadPromises);
    const imageUrls = uploaded.filter((item) => !item.isVideo).map((item) => item.url);
    const videoUrls = uploaded.filter((item) => item.isVideo).map((item) => item.url);
    const urls = uploaded.map((item) => item.url);

    return NextResponse.json({ urls, imageUrls, videoUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'خطا در آپلود فایل' }, { status: 500 });
  }
}
