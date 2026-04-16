'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReservationDateRangePicker from '@/components/reservations/ReservationDateRangePicker';

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
  submitLabel?: string;
};

export default function ReservationSearchForm({
  countries,
  cities,
  initialCountry = '',
  initialCity = '',
  initialStartDate = '',
  initialEndDate = '',
  submitLabel = 'نمایش خانه‌های آزاد',
}: Props) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const query = params.toString();
    router.push(query ? `/house-reservation?${query}` : '/house-reservation');
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <select
        name="country"
        value={country}
        onChange={(event) => setCountry(event.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
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
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
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

      <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium md:self-end">
        {submitLabel}
      </button>
    </form>
  );
}
