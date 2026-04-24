import bcrypt from 'bcryptjs';
import OTP from '@/models/OTP';
import connectDB from '@/lib/mongodb';

export const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateCode(): string {
  // 6-digit numeric code (000000–999999)
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}

export async function createOtp(identifier: string, channel: 'telegram' | 'email', code: string) {
  await connectDB();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
  // Invalidate previous unverified codes for this identifier+channel
  await OTP.deleteMany({ identifier, channel, verified: false });
  return OTP.create({ identifier, channel, codeHash, attempts: 0, verified: false, expiresAt });
}

export async function canSendAgain(identifier: string): Promise<boolean> {
  await connectDB();
  const last = await OTP.findOne({ identifier }).sort({ createdAt: -1 }).lean<any>();
  if (!last) return true;
  const diff = Date.now() - new Date(last.createdAt).getTime();
  return diff >= OTP_COOLDOWN_SECONDS * 1000;
}

export async function verifyOtp(identifier: string, code: string): Promise<{ ok: boolean; error?: string }> {
  await connectDB();
  const record: any = await OTP.findOne({ identifier, verified: false }).sort({ createdAt: -1 });
  if (!record) return { ok: false, error: 'کدی یافت نشد — ابتدا درخواست کد بدهید' };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, error: 'کد منقضی شده است' };
  if (record.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: 'تعداد تلاش بیش از حد مجاز — دوباره کد بگیرید' };

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { ok: false, error: 'کد نادرست است' };
  }
  record.verified = true;
  await record.save();
  return { ok: true };
}
