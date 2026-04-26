'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Globe2 } from 'lucide-react';
import SmartSelect, { type SmartSelectOption } from '@/components/ui/SmartSelect';
import { CITIES, COUNTRIES } from '@/lib/constants';

const COUNTRY_FLAGS: Record<string, string> = {
  italy: '🇮🇹',
  germany: '🇩🇪',
  uk: '🇬🇧',
  other: '🌍',
};

export default function HomeSearchPanel() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  // Country options with flags
  const countryOptions: SmartSelectOption[] = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.value,
        label: c.label,
        prefix: <span className="text-base leading-none">{COUNTRY_FLAGS[c.value] || '🌍'}</span>,
      })),
    [],
  );

  // City options grouped by country, filtered by selected country
  const cityOptions: SmartSelectOption[] = useMemo(() => {
    const filtered = country ? CITIES.filter((c) => c.country === country) : CITIES;
    return filtered.map((c) => {
      const matchedCountry = COUNTRIES.find((co) => co.value === c.country);
      return {
        value: c.value,
        label: c.label.split(' (')[0],
        hint: matchedCountry?.label || '',
        group: matchedCountry?.label || 'سایر',
        prefix: <span className="text-sm leading-none">{COUNTRY_FLAGS[c.country] || '🌍'}</span>,
      };
    });
  }, [country]);

  // Reset city if not in selected country
  const onCountryChange = (val: string) => {
    setCountry(val);
    if (val && city) {
      const stillValid = CITIES.some((c) => c.value === city && c.country === val);
      if (!stillValid) setCity('');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm md:grid-cols-[1.7fr_1fr_1fr_auto]"
    >
      {/* Free-text search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          name="q"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="مثلاً آپارتمان رم، لپ‌تاپ دست دوم..."
          className="w-full rounded-xl border-0 bg-transparent pr-10 pl-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
      </div>

      <SmartSelect
        value={country}
        onChange={onCountryChange}
        options={countryOptions}
        placeholder="همه کشورها"
        icon={<Globe2 size={15} />}
        searchable={false}
      />

      <SmartSelect
        value={city}
        onChange={setCity}
        options={cityOptions}
        placeholder={country ? 'انتخاب شهر' : 'همه شهرها'}
        icon={<MapPin size={15} />}
        groupOrder={['ایتالیا', 'آلمان', 'انگلستان']}
      />

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-white transition"
      >
        <Search size={16} />
        جست‌وجو
      </button>
    </form>
  );
}
