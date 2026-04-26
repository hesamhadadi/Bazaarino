'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Trash2,
  MessageSquare,
  Loader2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { toFaDigits } from '@/lib/locale';
import toast from 'react-hot-toast';

type ModComment = {
  _id: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  parentId?: string | null;
  isStaffReply?: boolean;
  userId?: { _id: string; name?: string; avatar?: string; role?: string } | null;
  articleId?: { _id: string; title: string; slug: string } | null;
};

type Counts = { pending: number; approved: number; rejected: number };

const TABS: Array<{ key: 'pending' | 'approved' | 'rejected' | 'all'; label: string }> = [
  { key: 'pending', label: 'در انتظار تأیید' },
  { key: 'approved', label: 'تأییدشده' },
  { key: 'rejected', label: 'رد/حذف‌شده' },
  { key: 'all', label: 'همه' },
];

export default function CommentsModeration({
  initialStatus,
}: {
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [items, setItems] = useState<ModComment[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${status}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function setItemStatus(id: string, next: 'approved' | 'rejected' | 'pending') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'خطا');
      toast.success(
        next === 'approved' ? 'تأیید شد' : next === 'rejected' ? 'رد شد' : 'به انتظار برگشت'
      );
      load();
    } catch (e: any) {
      toast.error(e?.message || 'خطا');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('این نظر برای همیشه حذف شود؟')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'خطا');
      }
      toast.success('حذف شد');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'خطا');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 inline-flex items-center gap-2">
            <MessageSquare size={20} className="text-orange-500" />
            مدیریت نظرات
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            بررسی، تأیید، رد و پاکسازی نظرات کاربران روی مقالات
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 font-bold">
            در انتظار: {toFaDigits(String(counts.pending))}
          </span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold">
            تأییدشده: {toFaDigits(String(counts.approved))}
          </span>
          <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-1 font-bold">
            رد شده: {toFaDigits(String(counts.rejected))}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px transition ${
              status === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">
          <Loader2 size={20} className="animate-spin inline-block ml-1" /> در حال بارگذاری...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">نظری در این بخش وجود ندارد.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li
              key={c._id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.userId?.avatar || '/default-avatar.svg'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                    <span className="font-bold text-gray-900">
                      {c.userId?.name || 'کاربر بازارینو'}
                    </span>
                    {c.userId?.role && c.userId.role !== 'user' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold">
                        {c.userId.role}
                      </span>
                    )}
                    <span>·</span>
                    <time dateTime={c.createdAt}>
                      {toFaDigits(new Date(c.createdAt).toLocaleString('fa-IR'))}
                    </time>
                    <StatusBadge status={c.status} />
                    {c.parentId && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        پاسخ
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-800 leading-7 whitespace-pre-line break-words">
                    {c.body}
                  </p>

                  {c.articleId && (
                    <Link
                      href={`/news/${encodeURIComponent(c.articleId.slug)}#comments`}
                      target="_blank"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
                    >
                      <ExternalLink size={11} />
                      {c.articleId.title}
                    </Link>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {c.status !== 'approved' && (
                      <button
                        disabled={busyId === c._id}
                        onClick={() => setItemStatus(c._id, 'approved')}
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                      >
                        <Check size={12} /> تأیید
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button
                        disabled={busyId === c._id}
                        onClick={() => setItemStatus(c._id, 'rejected')}
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                      >
                        <X size={12} /> رد
                      </button>
                    )}
                    {c.status !== 'pending' && (
                      <button
                        disabled={busyId === c._id}
                        onClick={() => setItemStatus(c._id, 'pending')}
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50"
                      >
                        <RotateCcw size={12} /> برگشت به انتظار
                      </button>
                    )}
                    <button
                      disabled={busyId === c._id}
                      onClick={() => deleteItem(c._id)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 ring-1 ring-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const label: Record<string, string> = {
    pending: 'در انتظار',
    approved: 'تأییدشده',
    rejected: 'ردشده',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-full font-bold ${map[status] || 'bg-gray-100'}`}>
      {label[status] || status}
    </span>
  );
}
