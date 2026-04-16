'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReservationDateRangePicker from '@/components/reservations/ReservationDateRangePicker';
import { getTodayLocalDateOnly } from '@/lib/reservation';

type Option = {
  value: string;
  label: string;
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <select
          name="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="h-12 border border-gray-200 rounded-2xl px-3 text-sm bg-white"
        >
          <option value="">همه کشورها</option>
          {countries.map((countryOption) => (
            <option key={countryOption.value} value={countryOption.value}>{countryOption.label}</option>
          ))}
        </select>
        <select
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-12 border border-gray-200 rounded-2xl px-3 text-sm bg-white"
        >
          <option value="">همه شهرها</option>
          {cities.map((cityOption) => (
            <option key={cityOption.value} value={cityOption.value}>{cityOption.label}</option>
          ))}
        </select>

        <div className="md:col-span-2">
          <ReservationDateRangePicker
            startDate={startDate}
            endDate={endDate}
            minStartDate={minDate}
            minEndDate={startDate || minDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white rounded-2xl px-4 h-12 text-sm font-semibold md:self-end">
          {submitLabel}
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="حداقل قیمت (€)"
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm bg-white"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="حداکثر قیمت (€)"
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm bg-white"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm bg-white"
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
            className="h-11 border border-gray-200 rounded-2xl px-3 text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            پاک‌کردن فیلترها
          </button>
        </div>
      )}
    </form>
  );
}
