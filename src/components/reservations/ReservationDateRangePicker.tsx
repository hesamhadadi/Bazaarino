'use client';

import { useState } from 'react';
import DateObject from 'react-date-object';
import DatePicker from 'react-multi-date-picker';
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

const CALENDAR_CONFIG: Record<CalendarMode, { calendar: any; locale: any; label: string }> = {
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

function toGregorianIso(value: unknown): string {
  if (!value) return '';

  const date = value instanceof DateObject ? value : new DateObject(value as any);
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

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-xl bg-indigo-100 p-1 text-xs">
        {(Object.keys(CALENDAR_CONFIG) as CalendarMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setCalendarMode(mode)}
            className={`rounded-lg px-3 py-1.5 transition ${
              calendarMode === mode ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600'
            }`}
          >
            {CALENDAR_CONFIG[mode].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <DatePicker
          value={toDateObject(startDate, calendarMode)}
          onChange={(value) => onStartDateChange(toGregorianIso(value))}
          calendar={config.calendar}
          locale={config.locale}
          minDate={toDateObject(minStartDate, calendarMode)}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          editable={false}
          inputClass="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm"
          placeholder="تاریخ ورود"
        />
        <DatePicker
          value={toDateObject(endDate, calendarMode)}
          onChange={(value) => onEndDateChange(toGregorianIso(value))}
          calendar={config.calendar}
          locale={config.locale}
          minDate={toDateObject(minEndDate, calendarMode)}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          editable={false}
          inputClass="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm"
          placeholder="تاریخ خروج"
        />
      </div>
    </div>
  );
}
