'use client';

import { useMemo, useState } from 'react';
import DateObject, { type Calendar, type Locale } from 'react-date-object';
import DatePicker, { type ChangedValue } from 'react-multi-date-picker';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_fa from 'react-date-object/locales/persian_fa';
import { calculateNights, parseDateOnlyInput } from '@/lib/reservation';

type CalendarMode = 'gregorian' | 'persian';

type Props = {
  startDate: string;
  endDate: string;
  minStartDate: string;
  minEndDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

const CALENDAR_CONFIG: Record<CalendarMode, { calendar: Calendar; locale: Locale; label: string }> = {
  gregorian: {
    calendar: gregorian,
    locale: gregorian_en,
    label: 'میلادی',
  },
  persian: {
    calendar: persian,
    locale: persian_fa,
    label: 'شمسی',
  },
};

function toDateObject(value: string, mode: CalendarMode) {
  if (!value) return undefined;
  // Parse the value as a Gregorian date string first
  const gregorianDate = new DateObject({
    date: value,
    format: 'YYYY-MM-DD',
    calendar: gregorian,
    locale: gregorian_en,
  });
  // Then convert to the desired calendar mode
  return gregorianDate.convert(CALENDAR_CONFIG[mode].calendar, CALENDAR_CONFIG[mode].locale);
}

function resolveDateObject(value: ChangedValue<false, false>): DateObject | null {
  if (!value) return null;

  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;

  // If it's already a DateObject instance
  if (candidate instanceof DateObject) {
    return candidate;
  }

  // Handle DateObject-like objects from react-multi-date-picker
  // These may have _isAMomentObject or _isDateObject flags
  if (typeof candidate === 'object') {
    // Try to create a new DateObject from the candidate's internal date value
    const anyCandidate = candidate as any;
    
    // Check for year/month/day properties that DateObject might have
    if (anyCandidate.year !== undefined && anyCandidate.month !== undefined && anyCandidate.day !== undefined) {
      try {
        const reconstructed = new DateObject({
          year: anyCandidate.year,
          month: anyCandidate.month,
          day: anyCandidate.day,
          calendar: anyCandidate.calendar || gregorian,
          locale: anyCandidate.locale || gregorian_en,
        });
        return reconstructed;
      } catch (e) {
        // Fall through to other checks
      }
    }
    
    // Check if it has convert method (DateObject-like duck typing)
    if (typeof anyCandidate.convert === 'function') {
      return candidate as DateObject;
    }
  }

  // Handle string dates - parse as Gregorian
  if (typeof candidate === 'string') {
    const parsed = new DateObject({ 
      date: candidate,
      calendar: gregorian,
      locale: gregorian_en,
      format: 'YYYY-MM-DD'
    });
    return Number.isNaN(parsed.toDate().getTime()) ? null : parsed;
  }

  return null;
}

function toGregorianIso(value: ChangedValue<false, false>): string {
  const date = resolveDateObject(value);
  if (!date) return '';
  
  try {
    // Convert to Gregorian calendar and format as ISO date string
    const gregorianDate = date.convert(gregorian, gregorian_en);
    const formatted = gregorianDate.format('YYYY-MM-DD');
    // Validate the result
    if (!formatted || formatted === 'Invalid Date' || !/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      return '';
    }
    return formatted;
  } catch (error) {
    console.error('Date conversion error:', error);
    return '';
  }
}

export default function ReservationDateRangePicker({
  startDate,
  endDate,
  minStartDate,
  minEndDate,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('gregorian');
  const config = CALENDAR_CONFIG[calendarMode];
  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = parseDateOnlyInput(startDate);
    const end = parseDateOnlyInput(endDate);
    if (!start || !end) return 0;
    return calculateNights(start, end);
  }, [startDate, endDate]);

  const handleStartDateChange = (value: ChangedValue<false, false>) => {
    const nextStart = toGregorianIso(value);
    onStartDateChange(nextStart);

    if (endDate && nextStart && endDate < nextStart) {
      onEndDateChange('');
    }
  };

  const handleEndDateChange = (value: ChangedValue<false, false>) => {
    const nextEnd = toGregorianIso(value);
    if (nextEnd && startDate && nextEnd <= startDate) {
      onEndDateChange('');
      return;
    }
    onEndDateChange(nextEnd);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm">
          {(Object.keys(CALENDAR_CONFIG) as CalendarMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCalendarMode(mode)}
              className={`rounded-full px-4 py-1.5 transition ${
                calendarMode === mode ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {CALENDAR_CONFIG[mode].label}
            </button>
          ))}
        </div>
        {nights > 0 ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
            {nights} شب
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-0 rounded-3xl border border-gray-200 bg-white p-2">
        <label className="space-y-1 rounded-2xl px-3 py-2 hover:bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-500">ورود</span>
          <DatePicker
            aria-label="تاریخ ورود"
            value={toDateObject(startDate, calendarMode)}
            onChange={handleStartDateChange}
            calendar={config.calendar}
            locale={config.locale}
            minDate={toDateObject(minStartDate, calendarMode)}
            format="YYYY/MM/DD"
            calendarPosition="auto"
            numberOfMonths={2}
            editable={false}
            inputClass="w-full h-6 border-0 px-0 text-sm font-semibold bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            containerClassName="w-full"
            placeholder="تاریخ ورود"
          />
        </label>
        <div className="hidden md:flex items-center justify-center text-xs text-gray-400">—</div>
        <label className="space-y-1 rounded-2xl px-3 py-2 hover:bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-500">خروج</span>
          <DatePicker
            aria-label="تاریخ خروج"
            value={toDateObject(endDate, calendarMode)}
            onChange={handleEndDateChange}
            calendar={config.calendar}
            locale={config.locale}
            minDate={toDateObject(minEndDate, calendarMode)}
            format="YYYY/MM/DD"
            calendarPosition="auto"
            numberOfMonths={2}
            editable={false}
            inputClass="w-full h-6 border-0 px-0 text-sm font-semibold bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            containerClassName="w-full"
            placeholder="تاریخ خروج"
          />
        </label>
      </div>
      {(startDate || endDate) ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              onStartDateChange('');
              onEndDateChange('');
            }}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
          >
            پاک کردن تاریخ‌ها
          </button>
        </div>
      ) : null}
    </div>
  );
}
