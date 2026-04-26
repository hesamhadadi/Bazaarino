'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import ReservationDateRangePicker from '@/components/reservations/ReservationDateRangePicker';
import { getTodayLocalDateOnly } from '@/lib/reservation';
import SmartSelect, { SmartSelectOption } from '@/components/ui/SmartSelect';

type Option = {
  value: string;
  label: string;
  country?: string;
};

const OTHER_COUNTRY_VALUE = 'other';

type Props = {
  countries: Option[];
  cities: Option[];
  initialCountry?: string;
  initialCity?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialSort?: string;
  showAdvancedFilters?: boolean;
  submitLabel?: string;
};

const SORT_OPTIONS: SmartSelectOption[] = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'priceAsc', label: 'ارزان‌ترین' },
  { value: 'priceDesc', label: 'گران‌ترین' },
];

export default function ReservationSearchForm({
  countries,
  cities,
  initialCountry = '',
  initialCity = '',
  initialStartDate = '',
  initialEndDate = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialSort = 'newest',
  showAdvancedFilters = false,
  submitLabel = 'جست‌وجوی خانه',
}: Props) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(
    Boolean(initialMinPrice || initialMaxPrice || (initialSort && initialSort !== 'newest')),
  );

  const minDate = useMemo(() => getTodayLocalDateOnly(), []);
  const filteredCities = useMemo(() => {
    if (!country) return cities;
    return cities.filter(
      (c) => c.country === country || c.country === OTHER_COUNTRY_VALUE,
    );
  }, [cities, country]);

  useEffect(() => {
    if (!city) return;
    const hasSelectedCity = filteredCities.some((c) => c.value === city);
    if (!hasSelectedCity) setCity('');
  }, [city, filteredCities]);

  const countryOptions: SmartSelectOption[] = useMemo(
    () => countries.map((c) => ({ value: c.value, label: c.label })),
    [countries],
  );

  const cityOptions: SmartSelectOption[] = useMemo(
    () => filteredCities.map((c) => ({ value: c.value, label: c.label })),
    [filteredCities],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (showAdvancedFilters && minPrice) params.set('minPrice', minPrice);
    if (showAdvancedFilters && maxPrice) params.set('maxPrice', maxPrice);
    if (showAdvancedFilters && sort) params.set('sort', sort);

    const query = params.toString();
    router.push(query ? `/house-reservation?${query}` : '/house-reservation');
  };

  const hasActiveFilters = Boolean(minPrice || maxPrice || (sort && sort !== 'newest'));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* WHERE */}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <MapPin size={14} />
            </span>
            <h3 className="text-sm font-bold text-gray-900">مقصد سفر</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <SmartSelect
              value={country}
              onChange={setCountry}
              options={countryOptions}
              placeholder="همه کشورها"
              icon={<MapPin size={14} />}
            />
            <SmartSelect
              value={city}
              onChange={setCity}
              options={cityOptions}
              placeholder="همه شهرها"
              icon={<Building2 size={14} />}
            />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* WHEN */}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <CalendarDays size={14} />
            </span>
            <h3 className="text-sm font-bold text-gray-900">تاریخ ورود و خروج</h3>
          </div>
          <ReservationDateRangePicker
            startDate={startDate}
            endDate={endDate}
            minStartDate={minDate}
            minEndDate={startDate || minDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* ADVANCED FILTERS */}
        {showAdvancedFilters && (
          <>
            <div className="border-t border-gray-100" />
            <div className="p-5 md:p-6">
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                className="w-full flex items-center justify-between gap-2 text-sm font-bold text-gray-900 hover:text-orange-600 transition"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <SlidersHorizontal size={14} />
                  </span>
                  فیلترهای بیشتر
                  {hasActiveFilters && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      فعال
                    </span>
                  )}
                </span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFilters && (
                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      حداقل قیمت (€ / شب)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="مثلاً ۳۰"
                      dir="ltr"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 px-3 text-sm text-right outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      حداکثر قیمت (€ / شب)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="مثلاً ۱۲۰"
                      dir="ltr"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 px-3 text-sm text-right outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      مرتب‌سازی
                    </label>
                    <SmartSelect
                      value={sort}
                      onChange={setSort}
                      options={SORT_OPTIONS}
                      placeholder="جدیدترین"
                      clearable={false}
                    />
                  </div>
                  {hasActiveFilters && (
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                          setSort('newest');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition"
                      >
                        <X size={12} /> پاک‌کردن فیلترها
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SEARCH BUTTON */}
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-base font-bold shadow-lg shadow-orange-500/25 transition active:scale-[0.99]"
      >
        <Search size={18} />
        {submitLabel}
      </button>
    </form>
  );
}
