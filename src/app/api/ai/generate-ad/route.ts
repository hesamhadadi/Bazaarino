import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORIES, getCityLabel } from '@/lib/constants';

/**
 * Generates an ad title + description from a few user-supplied hints
 * (images, category, city, listing mode) using Gemini 2.0 Flash.
 *
 * The model is asked to behave like a marketplace copywriter who knows
 * the Iranian community in Italy: short Persian title, friendly Persian
 * description with the right keywords for SEO, and an *optional* price
 * suggestion in EUR if it can confidently estimate one.
 *
 * We never store the generated text — the client simply pastes it into
 * the existing form, so the user can edit before publishing.
 */

export const runtime = 'nodejs';
// Generation can take up to 15s on cold path with vision + multiple
// images, so bump the default Vercel function timeout.
export const maxDuration = 30;

const MODEL = 'gemini-2.0-flash-exp';

interface GenerateRequest {
  category?: string;
  subcategory?: string;
  city?: string;
  listingMode?: 'offer' | 'request';
  priceType?: string;
  hints?: string; // free-form notes from the user
  /** Public image URLs already uploaded by the form */
  imageUrls?: string[];
}

interface GenerateResponse {
  title: string;
  description: string;
  suggestedPrice?: number | null;
  /** A few SEO-friendly tags that could be reused for #hashtags later. */
  tags?: string[];
}

function getCategoryLabels(categoryId?: string, subcategoryId?: string) {
  if (!categoryId) return { categoryLabel: '', subcategoryLabel: '' };
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return { categoryLabel: categoryId, subcategoryLabel: subcategoryId || '' };
  const sub = cat.subcategories.find((s) => s.value === subcategoryId);
  return {
    categoryLabel: cat.label,
    subcategoryLabel: sub?.label || subcategoryId || '',
  };
}

/** Download an image and return base64 + mime so Gemini can see it. */
async function fetchImagePart(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') || 'image/jpeg';
    // Gemini hard-limits to ~20MB per image; skip larger ones rather
    // than crashing the whole call.
    if (buf.byteLength > 18 * 1024 * 1024) return null;
    return {
      inlineData: {
        data: buf.toString('base64'),
        mimeType: mime,
      },
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI generator is not configured on the server.' },
      { status: 503 },
    );
  }

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { category, subcategory, city, listingMode, priceType, hints, imageUrls } = body;
  const { categoryLabel, subcategoryLabel } = getCategoryLabels(category, subcategory);
  const cityLabel = city ? getCityLabel(city) || city : '';

  // Cap to 4 images so we don't burn tokens on a 30-photo carousel.
  const limitedImageUrls = (imageUrls || []).slice(0, 4);
  const imageParts = (
    await Promise.all(limitedImageUrls.map(fetchImagePart))
  ).filter(Boolean) as Array<{ inlineData: { data: string; mimeType: string } }>;

  const modeText =
    listingMode === 'request' ? 'این یک «درخواست» است (کاربر دنبال این چیز می‌گردد)' : 'این یک «عرضه» است (کاربر می‌خواهد بفروشد/اجاره دهد)';

  const prompt = `تو یک کپی‌رایتر حرفه‌ای پلتفرم بازارینو هستی — مارکت‌پلیس ایرانیان مقیم اروپا (به‌خصوص ایتالیا).

وظیفه: بر اساس اطلاعات زیر و تصاویر پیوست‌شده، یک آگهی فارسی جذاب و SEO-friendly بساز.

اطلاعات آگهی:
- دسته‌بندی: ${categoryLabel || 'مشخص نشده'}
- زیر دسته: ${subcategoryLabel || 'مشخص نشده'}
- شهر: ${cityLabel || 'مشخص نشده'}
- نوع: ${modeText}
- نوع قیمت: ${priceType || 'fixed'}
${hints ? `- یادداشت کاربر: ${hints}` : ''}
${imageParts.length > 0 ? `- تعداد تصاویر پیوست: ${imageParts.length} (تصاویر را با دقت ببین و در توضیحات از جزئیاتشان استفاده کن)` : ''}

قواعد:
1. **عنوان**: حداکثر ۸۰ کاراکتر فارسی، روان، شامل کلیدواژه دسته‌بندی + شهر + ویژگی برجسته. بدون ایموجی اضافی.
2. **توضیحات**: ۳ تا ۵ پاراگراف کوتاه فارسی. شامل جزئیات قابل مشاهده در عکس‌ها (رنگ، اندازه، وضعیت)، نکات کاربردی، و یک خط آخر دعوت به تماس. از لیست‌های بولت‌دار استفاده کن (با • یا -). بین ۲۰۰ تا ۸۰۰ کاراکتر.
3. **قیمت پیشنهادی** (suggestedPrice): فقط اگر از روی تصاویر و دسته‌بندی، با اطمینان بالا قیمت بازار را در یورو می‌دانی. در غیر این صورت null برگردان.
4. **tags**: ۳ تا ۶ تگ فارسی کوتاه برای SEO و دسته‌بندی داخلی.
5. زبان: فارسی صحیح و روان. از کلمات انگلیسی فقط برای برندها استفاده کن.
6. هیچ‌گاه قیمت نامعقول یا اطلاعات شخصی پیشنهاد نده.

پاسخ را فقط به صورت JSON خام (بدون markdown fence) با این ساختار برگردان:
{
  "title": "...",
  "description": "...",
  "suggestedPrice": 350 یا null,
  "tags": ["...", "..."]
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const result = await model.generateContent([{ text: prompt }, ...imageParts]);
    const text = result.response.text();

    let parsed: GenerateResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Defensive: model occasionally wraps JSON in code fences despite
      // the responseMimeType hint. Strip them and retry once.
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed.title || !parsed.description) {
      throw new Error('AI response missing title or description');
    }

    return NextResponse.json({
      title: String(parsed.title).slice(0, 100),
      description: String(parsed.description).slice(0, 2000),
      suggestedPrice:
        typeof parsed.suggestedPrice === 'number' && Number.isFinite(parsed.suggestedPrice)
          ? Math.round(parsed.suggestedPrice)
          : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map(String) : [],
      imagesUsed: imageParts.length,
    });
  } catch (err) {
    console.error('[ai/generate-ad] failed', err);
    return NextResponse.json(
      { error: 'تولید آگهی با هوش مصنوعی ناموفق بود. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    );
  }
}
