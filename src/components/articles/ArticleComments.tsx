'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Loader2, ShieldCheck, Reply } from 'lucide-react';
import { toFaDigits } from '@/lib/locale';
import toast from 'react-hot-toast';

type ApiComment = {
  _id: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
  isStaffReply?: boolean;
  authorNameSnapshot?: string;
  authorAvatarSnapshot?: string;
  userId?: { _id: string; name?: string; avatar?: string; role?: string } | null;
};

type ThreadNode = ApiComment & { replies: ThreadNode[] };

function buildTree(items: ApiComment[]): ThreadNode[] {
  const byId = new Map<string, ThreadNode>();
  const roots: ThreadNode[] = [];
  for (const c of items) byId.set(c._id, { ...c, replies: [] });
  byId.forEach((node) => {
    if (node.parentId && byId.has(String(node.parentId))) {
      byId.get(String(node.parentId))!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function fmtDate(iso: string) {
  try {
    return toFaDigits(new Date(iso).toLocaleDateString('fa-IR'));
  } catch {
    return '';
  }
}

export default function ArticleComments({
  slug,
  initialCount = 0,
}: {
  slug: string;
  initialCount?: number;
}) {
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';

  const [items, setItems] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!cancelled && res.ok) setItems(data.items || []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tree = useMemo(() => buildTree(items), [items]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthed) {
      toast.error('برای ارسال نظر وارد شوید');
      return;
    }
    const body = text.trim();
    if (body.length < 2) {
      toast.error('متن خیلی کوتاه است');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentId: replyTo?.id || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'خطا');
      setText('');
      setReplyTo(null);
      if (data.pending) {
        toast.success('نظر پس از تأیید نمایش داده می‌شود');
      } else {
        toast.success('نظر ارسال شد');
        // Staff comment is auto-approved → push it to the list immediately.
        setItems((prev) => [...prev, data.item]);
      }
    } catch (e: any) {
      toast.error(e?.message || 'خطا در ارسال');
    } finally {
      setSubmitting(false);
    }
  }

  const totalApproved = items.length;
  const headerCount = totalApproved || initialCount;

  return (
    <section
      id="comments"
      className="mt-10 rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm"
      aria-label="نظرات"
    >
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle size={18} className="text-orange-500" />
        <h2 className="text-lg font-black text-gray-900">
          نظرات
          {headerCount > 0 && (
            <span className="text-gray-400 font-medium">
              {' '}
              ({toFaDigits(String(headerCount))})
            </span>
          )}
        </h2>
      </div>

      {/* Form */}
      {isAuthed ? (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 mb-6"
        >
          {replyTo && (
            <div className="mb-2 flex items-center justify-between text-xs text-gray-600 bg-white rounded-lg px-2 py-1.5 border border-gray-200">
              <span>
                در پاسخ به <strong>{replyTo.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-red-500 hover:underline"
              >
                لغو
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              replyTo
                ? `پاسخ به ${replyTo.name}...`
                : 'نظر، تجربه یا سوالت رو بنویس...'
            }
            rows={3}
            maxLength={2000}
            className="w-full bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-y"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400">
              {toFaDigits(String(text.length))}/۲۰۰۰
            </span>
            <button
              type="submit"
              disabled={submitting || text.trim().length < 2}
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl transition"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              ارسال نظر
            </button>
          </div>
          {session?.user?.role !== 'admin' && session?.user?.role !== 'editor' && (
            <p className="text-[11px] text-gray-400 mt-1.5">
              نظرات پس از تأیید تحریریه نمایش داده می‌شوند.
            </p>
          )}
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center mb-6 bg-gray-50/60">
          <p className="text-sm text-gray-600 mb-2">برای ثبت نظر باید وارد حساب کاربری شوید.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            ورود به حساب
          </Link>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin inline-block ml-1" /> در حال بارگذاری...
        </div>
      ) : tree.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          هنوز نظری ثبت نشده. اولین نفر باش!
        </div>
      ) : (
        <ul className="space-y-4">
          {tree.map((node) => (
            <CommentItem
              key={node._id}
              node={node}
              onReply={(id, name) => {
                setReplyTo({ id, name });
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ───────── Recursive item ───────── */

function CommentItem({
  node,
  depth = 0,
  onReply,
}: {
  node: ThreadNode;
  depth?: number;
  onReply: (id: string, name: string) => void;
}) {
  const name =
    node.userId?.name || node.authorNameSnapshot || 'کاربر بازارینو';
  const avatar =
    node.userId?.avatar || node.authorAvatarSnapshot || '/default-avatar.svg';
  const isStaff = node.isStaffReply || node.userId?.role === 'admin' || node.userId?.role === 'editor';

  return (
    <li className={depth > 0 ? 'mr-8 md:mr-10' : ''}>
      <article
        className={`rounded-2xl p-3.5 ring-1 ${
          isStaff
            ? 'bg-orange-50/60 ring-orange-100'
            : 'bg-white ring-gray-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-white shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{name}</span>
              {isStaff && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
                  <ShieldCheck size={10} />
                  تحریریه
                </span>
              )}
              <span className="text-[11px] text-gray-400">·</span>
              <time className="text-[11px] text-gray-400" dateTime={node.createdAt}>
                {fmtDate(node.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 text-sm text-gray-800 leading-7 whitespace-pre-line break-words">
              {node.body}
            </p>
            {depth < 3 && (
              <button
                type="button"
                onClick={() => onReply(node._id, name)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-orange-600"
              >
                <Reply size={11} />
                پاسخ
              </button>
            )}
          </div>
        </div>
      </article>

      {node.replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-r-2 border-orange-100 pr-3">
          {node.replies.map((child) => (
            <CommentItem
              key={child._id}
              node={child}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
