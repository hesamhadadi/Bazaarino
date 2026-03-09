'use client';

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import type { LatLng } from '@/lib/map-data';

interface Props {
  point: LatLng;
}

export default function HousingLocationPreview({ point }: Props) {
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
        <CircleMarker center={[point.lat, point.lng]} radius={8} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 }} />
      </MapContainer>
    </div>
  );
}
