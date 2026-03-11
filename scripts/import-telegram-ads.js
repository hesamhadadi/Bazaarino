/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: node scripts/import-telegram-ads.js /path/to/file.json');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(fileArg), 'utf-8');
const data = JSON.parse(raw);
const messages = Array.isArray(data) ? data : data.messages || [];

const AdSchema = new mongoose.Schema({}, { strict: false, collection: 'ads' });
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const Ad = mongoose.models._TelegramAd || mongoose.model('_TelegramAd', AdSchema);
const User = mongoose.models._TelegramUser || mongoose.model('_TelegramUser', UserSchema);

const cityMap = [
  { re: /تورین|تورينو|torino/i, value: 'turin' },
  { re: /بولونیا|bologna/i, value: 'bologna' },
  { re: /میلان|milano|milan/i, value: 'milan' },
  { re: /رم|roma|rome/i, value: 'rome' },
  { re: /فلورانس|firenze|florence/i, value: 'florence' },
  { re: /ونیز|venezia|venice/i, value: 'venice' },
  { re: /ناپل|napoli|naples/i, value: 'naples' },
  { re: /جنوا|genova|genoa/i, value: 'genoa' },
];

const adKeywords = [
  'اجاره', 'فروش', 'قیمت', 'یورو', '€', 'آگهی', 'رهن', 'ودیعه', 'اتاق', 'خانه', 'آپارتمان', 'دوپیا', 'سینگل'
];

function normalizeDigits(str) {
  const map = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  return str.replace(/[۰-۹]/g, (d) => map[d] || d);
}

function pickTitle(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.length < 4) continue;
    return line.replace(/[#*_]/g, '').slice(0, 80);
  }
  return lines[0]?.slice(0, 80) || 'آگهی تلگرام';
}

function detectCity(text) {
  for (const c of cityMap) {
    if (c.re.test(text)) return c.value;
  }
  return 'turin';
}

function detectCategory(text) {
  if (/اجاره|اتاق|خانه|آپارتمان|رهن|ودیعه|مسکن/i.test(text)) return 'real-estate';
  return 'other';
}

function detectSubcategory(text) {
  if (/اتاق|دوپیا|سینگل/i.test(text)) return 'room-rent';
  if (/آپارتمان/i.test(text)) return 'apartment-rent';
  if (/خانه/i.test(text)) return 'house-rent';
  if (/فروش/i.test(text)) return 'apartment-sale';
  return 'room-rent';
}

function extractPrice(text) {
  const normalized = normalizeDigits(text);
  const euroMatch = normalized.match(/€\s*([0-9]{1,6})|([0-9]{1,6})\s*€|([0-9]{1,6})\s*یورو/);
  if (!euroMatch) return null;
  const num = euroMatch[1] || euroMatch[2] || euroMatch[3];
  return num ? Number(num) : null;
}

function isAd(text) {
  if (!text || text.length < 40) return false;
  return adKeywords.some(k => text.includes(k));
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' }).lean();
  if (!admin?._id) {
    console.error('No admin user found');
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  const placeholderImage = '/placeholder-ad.svg';
  const channelName = (data.channel && (data.channel.title || data.channel.name)) || 'telegram';

  for (const msg of messages) {
    const text = typeof msg.text === 'string' ? msg.text.trim() : '';
    if (!isAd(text)) {
      skipped++;
      continue;
    }

    const existing = await Ad.findOne({ 'importSource.messageId': msg.id, 'importSource.channel': channelName }).lean();
    if (existing) {
      skipped++;
      continue;
    }

    const title = pickTitle(text);
    const city = detectCity(text);
    const category = detectCategory(text);
    const subcategory = detectSubcategory(text);
    const price = extractPrice(text);
    const priceType = /توافقی/i.test(text) ? 'negotiable' : price ? 'fixed' : 'negotiable';

    const payload = {
      title,
      description: text,
      price: price || undefined,
      priceType,
      currency: 'EUR',
      category,
      subcategory,
      country: 'italy',
      city,
      images: [placeholderImage],
      status: 'pending',
      userId: admin._id,
      showPhone: false,
      showEmail: false,
      importSource: {
        channel: channelName,
        messageId: msg.id,
        date: msg.date || null,
      },
    };

    await Ad.create(payload);
    inserted++;
  }

  console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
