import Ad from '@/models/Ad';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/app-url';

type ModerationStatus = 'approved' | 'rejected';

export async function updateAdStatusAndNotifyOwner(adId: string, status: ModerationStatus, rejectionReason?: string) {
  const ad = await Ad.findById(adId);
  if (!ad) return null;

  ad.status = status;
  if (status === 'approved') {
    ad.rejectionReason = undefined;
  } else if (rejectionReason) {
    ad.rejectionReason = rejectionReason;
  }
  await ad.save();

  try {
    const owner = (await User.findById(ad.userId).select('email name').lean()) as { email?: string; name?: string } | null;
    const to = owner?.email || ad.email;
    if (to) {
      const appUrl = getAppUrl().replace(/\/$/, '');
      const adUrl = `${appUrl}/ads/${ad._id}`;
      const adTitle = String(ad.title || 'آگهی شما');
      const reason = (status === 'rejected' ? (rejectionReason || ad.rejectionReason || 'رد شده توسط مدیر') : '').trim();
      const escapeHtml = (value: string) =>
        value
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      const safeName = owner?.name ? escapeHtml(String(owner.name)) : '';
      const safeTitle = escapeHtml(adTitle);
      const safeReason = escapeHtml(reason);
      const safeUrl = escapeHtml(adUrl);

      if (status === 'approved') {
        await sendEmail({
          to,
          subject: 'آگهی شما تأیید شد',
          text: `سلام${owner?.name ? ` ${owner.name}` : ''}،\n\nآگهی شما با عنوان «${adTitle}» تأیید شد.\nمشاهده آگهی: ${adUrl}`,
          html: `<p>سلام${safeName ? ` ${safeName}` : ''}،</p><p>آگهی شما با عنوان <strong>${safeTitle}</strong> تأیید شد.</p><p><a href="${safeUrl}">مشاهده آگهی</a></p>`,
        });
      } else {
        await sendEmail({
          to,
          subject: 'آگهی شما رد شد',
          text: `سلام${owner?.name ? ` ${owner.name}` : ''}،\n\nآگهی شما با عنوان «${adTitle}» رد شد.\nدلیل رد: ${reason}\nمشاهده آگهی: ${adUrl}`,
          html: `<p>سلام${safeName ? ` ${safeName}` : ''}،</p><p>آگهی شما با عنوان <strong>${safeTitle}</strong> رد شد.</p><p><strong>دلیل رد:</strong> ${safeReason}</p><p><a href="${safeUrl}">مشاهده آگهی</a></p>`,
        });
      }
    }
  } catch {}

  return ad;
}
