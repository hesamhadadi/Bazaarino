import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Admin-only image-URL validator. Used by the city-visuals editor to
 * verify that a pasted URL actually returns an image before the admin
 * commits it. Performs a HEAD first (cheap) and falls back to a ranged
 * GET when the upstream rejects HEAD (Unsplash sometimes does).
 *
 * Returns: { ok, status, contentType, contentLength?, error? }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { url } = await request.json().catch(() => ({}));
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ ok: false, error: 'url الزامی است' }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: 'URL باید با http یا https شروع شود' });
  }

  // 8s ceiling so a slow/dead host can't pin our route.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
      // Some CDNs (Unsplash) deny HEAD with 405 — retry as a ranged GET.
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1023' },
          signal: ctrl.signal,
          redirect: 'follow',
        });
      }
    } catch (err) {
      clearTimeout(timer);
      return NextResponse.json({
        ok: false,
        error: err instanceof Error ? err.message : 'fetch failed',
      });
    }

    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';
    const contentLength = res.headers.get('content-length');
    const isImage = contentType.toLowerCase().startsWith('image/');

    return NextResponse.json({
      ok: res.ok && isImage,
      status: res.status,
      contentType,
      contentLength: contentLength ? Number(contentLength) : undefined,
      error: !res.ok
        ? `پاسخ ${res.status}`
        : !isImage
          ? `فرمت معتبر نیست (${contentType || 'unknown'})`
          : undefined,
    });
  } catch (err) {
    clearTimeout(timer);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'خطای ناشناخته',
    });
  }
}
