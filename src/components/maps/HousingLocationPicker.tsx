'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import type { LatLng } from '@/lib/map-data';
import { CITY_CENTERS } from '@/lib/map-data';
import { BRAND_COLOR_EVENT, readBrandPrimaryFromDocument } from '@/lib/brand-color';

interface Props {
  city: string;
  value: LatLng | null;
  onChange: (value: LatLng) => void;
}

function ClickHandler({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

export default function HousingLocationPicker({ city, value, onChange }: Props) {
  const center = useMemo(() => CITY_CENTERS[city] || CITY_CENTERS.other, [city]);
  const [markerColor, setMarkerColor] = useState(readBrandPrimaryFromDocument);

  useEffect(() => {
    const syncColor = () => setMarkerColor(readBrandPrimaryFromDocument());
    window.addEventListener(BRAND_COLOR_EVENT, syncColor);
    return () => window.removeEventListener(BRAND_COLOR_EVENT, syncColor);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        key={city}
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: 260, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {value && (
          <CircleMarker center={[value.lat, value.lng]} radius={8} pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.9 }} />
        )}
      </MapContainer>
    </div>
  );
}
