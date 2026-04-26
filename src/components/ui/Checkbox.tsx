'use client';

import { Check, Minus } from 'lucide-react';
import { forwardRef, InputHTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  size?: Size;
  indeterminate?: boolean;
  /** Renders just the box without surrounding label spacing. */
  bare?: boolean;
};

const SIZES: Record<Size, { box: string; icon: number; gap: string; text: string }> = {
  sm: { box: 'h-4 w-4 rounded', icon: 12, gap: 'gap-2', text: 'text-xs' },
  md: { box: 'h-5 w-5 rounded-md', icon: 14, gap: 'gap-2.5', text: 'text-sm' },
  lg: { box: 'h-6 w-6 rounded-lg', icon: 16, gap: 'gap-3', text: 'text-base' },
};

const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, hint, size = 'md', indeterminate, bare, className = '', checked, disabled, ...rest },
  ref,
) {
  const s = SIZES[size];
  const box = (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center border transition ${s.box} ${
        checked || indeterminate
          ? 'bg-orange-500 border-orange-500 text-white'
          : 'bg-white border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        {...rest}
      />
      {indeterminate ? (
        <Minus size={s.icon} strokeWidth={3} />
      ) : checked ? (
        <Check size={s.icon} strokeWidth={3} />
      ) : null}
    </span>
  );

  if (bare || !label) {
    return <span className={className}>{box}</span>;
  }

  return (
    <label
      className={`inline-flex items-start ${s.gap} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {box}
      <span className={`leading-tight ${s.text}`}>
        <span className="text-gray-800 font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-gray-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
});

export default Checkbox;
