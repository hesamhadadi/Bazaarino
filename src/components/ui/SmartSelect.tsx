'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export type SmartSelectOption = {
  value: string;
  label: string;
  hint?: string;
  group?: string;
  prefix?: React.ReactNode; // emoji/icon shown before label
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SmartSelectOption[];
  placeholder: string;
  /** Visual icon shown inside the trigger button */
  icon?: React.ReactNode;
  /** Show a search box inside the dropdown (default: auto if > 8 options) */
  searchable?: boolean;
  /** Allow clearing the value */
  clearable?: boolean;
  className?: string;
  /** Optional name for hidden input (so the form submits the value) */
  name?: string;
  disabled?: boolean;
  /** Group order */
  groupOrder?: string[];
};

export default function SmartSelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
  searchable,
  clearable = true,
  className = '',
  name,
  disabled,
  groupOrder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 8;
  const selected = options.find((o) => o.value === value);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Focus search field on open
  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    if (!open) setQuery('');
  }, [open, showSearch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint || '').toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [query, options]);

  // Group by `group`
  const grouped = useMemo(() => {
    const map: Record<string, SmartSelectOption[]> = {};
    for (const o of filtered) {
      const g = o.group || '';
      (map[g] ||= []).push(o);
    }
    const keys = Object.keys(map);
    if (groupOrder) {
      return groupOrder
        .filter((g) => map[g])
        .concat(keys.filter((k) => !groupOrder.includes(k)))
        .map((g) => ({ group: g, items: map[g] }));
    }
    return keys.map((g) => ({ group: g, items: map[g] }));
  }, [filtered, groupOrder]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset highlight on filter change
  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const onItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[highlight];
      if (item) {
        onChange(item.value);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`group w-full flex items-center gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 px-3 py-3 text-sm text-right transition disabled:opacity-50 ${
          open ? 'ring-2 ring-orange-400/30 bg-white' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
        <span className={`flex-1 truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selected ? (
            <span className="inline-flex items-center gap-1.5">
              {selected.prefix}
              {selected.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        {clearable && selected && (
          <span
            role="button"
            aria-label="پاک کردن"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-0.5 text-gray-400 hover:text-gray-700 rounded transition"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
          onKeyDown={onItemKeyDown}
        >
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
              <Search size={14} className="text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onItemKeyDown}
                placeholder="جست‌وجو..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="پاک کردن"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <div role="listbox" className="max-h-72 overflow-y-auto py-1">
            {flatItems.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400">
                نتیجه‌ای یافت نشد
              </div>
            )}
            {grouped.map((g) => (
              <div key={g.group || '__'} className="py-0.5">
                {g.group && (
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {g.group}
                  </div>
                )}
                {g.items.map((item) => {
                  const flatIdx = flatItems.indexOf(item);
                  const isActive = highlight === flatIdx;
                  const isSelected = item.value === value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(flatIdx)}
                      onClick={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-right transition ${
                        isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.prefix && (
                        <span
                          className={`shrink-0 w-5 text-center ${
                            isActive ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {item.prefix}
                        </span>
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span
                          className={`text-[10px] ${
                            isActive ? 'text-gray-300' : 'text-gray-400'
                          }`}
                        >
                          {item.hint}
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          size={14}
                          className={isActive ? 'text-orange-300' : 'text-orange-500'}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
