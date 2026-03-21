'use client';

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import type { LatLng } from '@/lib/map-data';
import { DEFAULT_BRAND_PRIMARY } from '@/lib/brand-color';

interface Props {
  point: LatLng;
}

export default function HousingLocationPreview({ point }: Props) {
  const markerColor = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || DEFAULT_BRAND_PRIMARY
    : DEFAULT_BRAND_PRIMARY;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[point.lat, point.lng]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        style={{ height: 240, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[point.lat, point.lng]} radius={8} pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.9 }} />
      </MapContainer>
    </div>
  );
}
