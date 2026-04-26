import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

type Props = {
  /** Eyebrow label above the title (e.g. "اطلاعات حقوقی"). */
  eyebrow?: string;
  /** Main page title. */
  title: string;
  /** Optional subtitle/description shown under the title. */
  subtitle?: string;
  /** Optional metadata line (e.g. "آخرین به‌روزرسانی: ..."). */
  meta?: React.ReactNode;
  /** Hero icon shown to the right of the title in a colored chip. */
  icon?: React.ReactNode;
  /** Card body. */
  children: React.ReactNode;
  /** Constrain max width of card. Defaults to 3xl (~768px). */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
};

const WIDTH_CLS: Record<NonNullable<Props['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export default function ProsePage({
  eyebrow,
  title,
  subtitle,
  meta,
  icon,
  children,
  maxWidth = '3xl',
}: Props) {
  const widthCls = WIDTH_CLS[maxWidth];

  return (
    <div className="relative min-h-screen bg-white">
      {/* Decorative background — soft gradient + dot grid */}
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-orange-50/70 via-amber-50/30 to-transparent pointer-events-none" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(249,115,22,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse at top, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at top, black 30%, transparent 75%)',
        }}
      />

      <Navbar />

      <main className="relative">
        {/* Hero */}
        <section className={`${widthCls} mx-auto px-4 pt-10 md:pt-16 pb-6`}>
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {eyebrow}
            </div>
          )}
          <div className="flex items-start gap-4">
            {icon && (
              <span className="hidden md:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-orange-100 text-orange-600 shadow-sm">
                {icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm md:text-base text-gray-600 leading-7 max-w-2xl">
                  {subtitle}
                </p>
              )}
              {meta && (
                <p className="mt-3 text-xs text-gray-500">{meta}</p>
              )}
            </div>
          </div>
        </section>

        {/* Body card */}
        <section className={`${widthCls} mx-auto px-4 pb-24 md:pb-16`}>
          <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 md:p-10">
            {children}
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
