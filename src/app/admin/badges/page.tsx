'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Badge {
  _id: string;
  slug: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  gradient?: string;
  tier?: 'common' | 'rare' | 'epic' | 'legendary';
  isPublic?: boolean;
  order?: number;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [editing, setEditing] = useState<Badge | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Badge>>({
    slug: '',
    label: '',
    description: '',
    icon: 'Award',
    color: '#f97316',
    gradient: '',
    tier: 'common',
    isPublic: true,
    order: 0,
  });

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch('/api/badges');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBadges(data.badges || []);
    } catch {
      toast.error('خطا در دریافت بج‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const seedDefaults = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seedDefaults' }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('بج‌های پیش‌فرض اضافه شدند');
      fetchBadges();
    } catch {
      toast.error('خطا در افزودن بج‌های پیش‌فرض');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.slug || !form.label) {
      toast.error('شناسه و نام بج الزامی است');
      return;
    }
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed');
      }
      toast.success('بج ساخته شد');
      setCreating(false);
      setForm({
        slug: '',
        label: '',
        description: '',
        icon: 'Award',
        color: '#f97316',
        gradient: '',
        tier: 'common',
        isPublic: true,
        order: 0,
      });
      fetchBadges();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ساخت بج');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/badges/${editing.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('بج به‌روزرسانی شد');
      setEditing(null);
      fetchBadges();
    } catch {
      toast.error('خطا در به‌روزرسانی بج');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('آیا از حذف این بج اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/badges/${slug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('بج حذف شد');
      fetchBadges();
    } catch {
      toast.error('خطا در حذف بج');
    }
  };

  const startEdit = (badge: Badge) => {
    setEditing(badge);
    setForm({ ...badge });
  };

  const tierColors = {
    common: 'bg-gray-100 text-gray-700',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-amber-100 text-amber-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-orange-500" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-orange-500" />
            مدیریت بج‌ها
          </h1>
          <p className="text-sm text-gray-500 mt-1">{badges.length} بج موجود</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={seedDefaults}
            disabled={seedLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            <Sparkles size={14} />
            {seedLoading ? 'در حال افزودن...' : 'بج‌های پیش‌فرض'}
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
          >
            <Plus size={14} />
            بج جدید
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                {editing ? 'ویرایش بج' : 'بج جدید'}
              </h2>
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    شناسه (slug) *
                  </label>
                  <input
                    type="text"
                    value={form.slug || ''}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    disabled={!!editing}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                    placeholder="verified-pro"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    نام *
                  </label>
                  <input
                    type="text"
                    value={form.label || ''}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="کاربر تاییدشده"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  توضیحات
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="توضیح کوتاه..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    آیکون
                  </label>
                  <input
                    type="text"
                    value={form.icon || ''}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="Award"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    رنگ
                  </label>
                  <input
                    type="color"
                    value={form.color || '#f97316'}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-9 border rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    سطح
                  </label>
                  <select
                    value={form.tier || 'common'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tier: e.target.value as Badge['tier'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="common">معمولی</option>
                    <option value="rare">کمیاب</option>
                    <option value="epic">حیرت‌انگیز</option>
                    <option value="legendary">افسانه‌ای</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  گرادیان (CSS)
                </label>
                <input
                  type="text"
                  value={form.gradient || ''}
                  onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  placeholder="linear-gradient(135deg, #ff6b6b, #feca57)"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="rounded text-orange-500"
                  />
                  عمومی
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">ترتیب:</span>
                  <input
                    type="number"
                    value={form.order || 0}
                    onChange={(e) =>
                      setForm({ ...form, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 px-2 py-1 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                انصراف
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              >
                <Save size={14} />
                {editing ? 'ذخیره' : 'ساخت'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badges Grid */}
      {badges.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">هنوز هیچ بجی ساخته نشده</p>
          <button
            onClick={() => setCreating(true)}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            اولین بج را بسازید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((badge) => (
              <div
                key={badge._id}
                className="bg-white border rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{
                        background:
                          badge.gradient || badge.color || '#f97316',
                      }}
                    >
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {badge.label}
                      </h3>
                      <code className="text-xs text-gray-400">{badge.slug}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(badge)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(badge.slug)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {badge.description || 'بدون توضیحات'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tierColors[badge.tier || 'common']
                    }`}
                  >
                    {badge.tier === 'common' && 'معمولی'}
                    {badge.tier === 'rare' && 'کمیاب'}
                    {badge.tier === 'epic' && 'حیرت‌انگیز'}
                    {badge.tier === 'legendary' && 'افسانه‌ای'}
                  </span>
                  {!badge.isPublic && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      مخفی
                    </span>
                  )}
                  <span className="text-xs text-gray-400 mr-auto">
                    ترتیب: {badge.order || 0}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">نکات مهم:</p>
          <ul className="list-disc mr-5 space-y-1">
            <li>برای اختصاص بج به کاربر، به صفحه جزئیات کاربر مراجعه کنید</li>
            <li>بج‌های حذف‌شده از پروفایل کاربران هم حذف می‌شوند</li>
            <li>فیلد gradient اولویت بالاتری نسبت به color دارد</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
