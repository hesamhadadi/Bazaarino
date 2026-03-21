'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import type { LatLng } from '@/lib/map-data';
import { BRAND_COLOR_EVENT, readBrandPrimaryFromDocument } from '@/lib/brand-color';

interface Props {
  point: LatLng;
}

export default function HousingLocationPreview({ point }: Props) {
  const [markerColor, setMarkerColor] = useState(readBrandPrimaryFromDocument);

  useEffect(() => {
    const syncColor = () => setMarkerColor(readBrandPrimaryFromDocument());
    window.addEventListener(BRAND_COLOR_EVENT, syncColor);
    return () => window.removeEventListener(BRAND_COLOR_EVENT, syncColor);
  }, []);

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
