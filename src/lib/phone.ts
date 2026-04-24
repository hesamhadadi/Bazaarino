const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) { out += String(p); continue; }
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) { out += String(a); continue; }
    out += ch;
  }
  return out;
}

// Normalize to E.164-like format: leading + kept, rest digits only.
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const cleaned = normalizeDigits(input).trim();
  // Replace common 00 prefix with +, remove spaces/dashes/parens
  let s = cleaned.replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  // If Iranian mobile without country code (09xxxxxxxxx) convert to +98
  if (/^09\d{9}$/.test(s)) s = '+98' + s.slice(1);
  // Must start with + and 8-15 digits
  if (!/^\+\d{8,15}$/.test(s)) return null;
  return s;
}

export function maskPhone(phone: string): string {
  const p = normalizePhone(phone) || phone;
  if (p.length < 6) return p;
  return p.slice(0, 4) + '***' + p.slice(-3);
}
