'use client';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Render label/hint to the LEFT of the switch (default) or right. RTL-aware. */
  reverse?: boolean;
  className?: string;
};

// The site is rendered RTL (<html dir="rtl">), so a positive `translate-x`
// pushes the thumb further past the right edge of the track and clips it.
// We use negative translates to move the thumb inward / toward the visual
// LEFT (which is the natural "ON" position in RTL).
const SIZE_CLS = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-3.5 w-3.5',
    on: '-translate-x-[18px]',
    off: '-translate-x-0.5',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-4 w-4',
    on: '-translate-x-6',
    off: '-translate-x-1',
  },
};

export default function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
  size = 'md',
  reverse,
  className = '',
}: Props) {
  const s = SIZE_CLS[size];
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${s.track} items-center rounded-full transition shrink-0 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block ${s.thumb} transform rounded-full bg-white shadow transition ${
          checked ? s.on : s.off
        }`}
      />
    </button>
  );

  if (!label && !hint) return <span className={className}>{button}</span>;

  return (
    <label
      className={`flex items-start ${reverse ? 'flex-row-reverse' : ''} justify-between gap-3 py-1 ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <span className="flex-1 min-w-0">
        {label && <span className="block text-sm font-medium text-gray-900">{label}</span>}
        {hint && <span className="block text-[11px] text-gray-500 mt-0.5">{hint}</span>}
      </span>
      {button}
    </label>
  );
}
