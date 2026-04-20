'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import ReservationDateRangePicker from '@/components/reservations/ReservationDateRangePicker';
import { getTodayLocalDateOnly } from '@/lib/reservation';

type Option = {
  value: string;
  label: string;
  country?: string;
};

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
  submitLabel = 'نمایش خانه‌های آزاد',
}: Props) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);

  const minDate = useMemo(() => getTodayLocalDateOnly(), []);
  const filteredCities = useMemo(() => {
    if (!country) return cities;
    return cities.filter((cityOption) => cityOption.country === country || cityOption.country === 'other');
  }, [cities, country]);

  useEffect(() => {
    if (!city) return;
    const hasSelectedCity = filteredCities.some((cityOption) => cityOption.value === city);
    if (!hasSelectedCity) setCity('');
  }, [city, filteredCities]);

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

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="rounded-[32px] border border-gray-200 bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr_auto] gap-2">
          <div className="rounded-3xl border border-transparent bg-gray-50 px-3 py-2 transition hover:border-gray-200 hover:bg-white">
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">کشور</label>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-gray-400" />
              <select
                name="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-7 w-full border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
              >
                <option value="">همه کشورها</option>
                {countries.map((countryOption) => (
                  <option key={countryOption.value} value={countryOption.value}>{countryOption.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-transparent bg-gray-50 px-3 py-2 transition hover:border-gray-200 hover:bg-white">
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">شهر</label>
            <div className="flex items-center gap-2">
              <Building2 size={16} className="shrink-0 text-gray-400" />
              <select
                name="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-7 w-full border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
              >
                <option value="">همه شهرها</option>
                {filteredCities.map((cityOption) => (
                  <option key={cityOption.value} value={cityOption.value}>{cityOption.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-transparent bg-gray-50 p-2 transition hover:border-gray-200 hover:bg-white">
            <ReservationDateRangePicker
              startDate={startDate}
              endDate={endDate}
              minStartDate={minDate}
              minEndDate={startDate || minDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>

          <button
            type="submit"
            className="h-12 min-h-12 rounded-3xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 lg:h-auto"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Search size={16} />
              {submitLabel}
            </span>
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative">
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="حداقل قیمت (€)"
              className="h-11 w-full border border-gray-200 rounded-2xl px-3 text-sm bg-white focus:border-gray-300 focus:outline-none"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="حداکثر قیمت (€)"
              className="h-11 w-full border border-gray-200 rounded-2xl px-3 text-sm bg-white focus:border-gray-300 focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm bg-white focus:border-gray-300 focus:outline-none"
          >
            <option value="newest">مرتب‌سازی: جدیدترین</option>
            <option value="priceAsc">مرتب‌سازی: ارزان‌ترین</option>
            <option value="priceDesc">مرتب‌سازی: گران‌ترین</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setMinPrice('');
              setMaxPrice('');
              setSort('newest');
            }}
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <SlidersHorizontal size={15} />
            پاک‌کردن فیلترها
          </button>
        </div>
      )}
    </form>
  );
}
