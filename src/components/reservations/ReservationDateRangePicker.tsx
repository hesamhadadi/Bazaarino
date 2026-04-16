'use client';

import { useState } from 'react';
import DateObject, { type Calendar, type Locale } from 'react-date-object';
import DatePicker, { type ChangedValue } from 'react-multi-date-picker';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_fa from 'react-date-object/locales/persian_fa';

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
  return new DateObject({
    date: value,
    format: 'YYYY-MM-DD',
    calendar: gregorian,
    locale: gregorian_en,
  }).convert(CALENDAR_CONFIG[mode].calendar, CALENDAR_CONFIG[mode].locale);
}

function resolveDateObject(value: ChangedValue<false, false>): DateObject | null {
  if (!value) return null;

  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;

  if (candidate instanceof DateObject) return candidate;

  if (typeof candidate === 'string') {
    const parsed = new DateObject({ date: candidate });
    return Number.isNaN(parsed.toDate().getTime()) ? null : parsed;
  }

  if (typeof (candidate as DateObject).convert === 'function') {
    return candidate as DateObject;
  }

  return null;
}

function toGregorianIso(value: ChangedValue<false, false>): string {
  const date = resolveDateObject(value);
  if (!date) return '';
  return date.convert(gregorian, gregorian_en).format('YYYY-MM-DD');
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
      <div className="inline-flex rounded-2xl bg-indigo-100 p-1.5 text-sm">
        {(Object.keys(CALENDAR_CONFIG) as CalendarMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setCalendarMode(mode)}
            className={`rounded-xl px-4 py-2 transition ${
              calendarMode === mode ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-indigo-700/80'
            }`}
          >
            {CALENDAR_CONFIG[mode].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">ورود</span>
          <DatePicker
            aria-label="تاریخ ورود"
            value={toDateObject(startDate, calendarMode)}
            onChange={handleStartDateChange}
            calendar={config.calendar}
            locale={config.locale}
            minDate={toDateObject(minStartDate, calendarMode)}
            format="YYYY/MM/DD"
            calendarPosition="bottom-right"
            numberOfMonths={2}
            editable={false}
            inputClass="w-full h-12 border border-indigo-200 rounded-2xl px-4 text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="تاریخ ورود را انتخاب کنید"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">خروج</span>
          <DatePicker
            aria-label="تاریخ خروج"
            value={toDateObject(endDate, calendarMode)}
            onChange={handleEndDateChange}
            calendar={config.calendar}
            locale={config.locale}
            minDate={toDateObject(minEndDate, calendarMode)}
            format="YYYY/MM/DD"
            calendarPosition="bottom-right"
            numberOfMonths={2}
            editable={false}
            inputClass="w-full h-12 border border-indigo-200 rounded-2xl px-4 text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="تاریخ خروج را انتخاب کنید"
          />
        </label>
      </div>
    </div>
  );
}
