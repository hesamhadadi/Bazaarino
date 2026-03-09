export type LatLng = { lat: number; lng: number };

export const CITY_CENTERS: Record<string, LatLng> = {
  rome: { lat: 41.9028, lng: 12.4964 },
  milan: { lat: 45.4642, lng: 9.19 },
  florence: { lat: 43.7696, lng: 11.2558 },
  venice: { lat: 45.4408, lng: 12.3155 },
  naples: { lat: 40.8518, lng: 14.2681 },
  turin: { lat: 45.0703, lng: 7.6869 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  genoa: { lat: 44.4056, lng: 8.9463 },
  palermo: { lat: 38.1157, lng: 13.3615 },
  catania: { lat: 37.5079, lng: 15.083 },
  verona: { lat: 45.4384, lng: 10.9916 },
  bari: { lat: 41.1171, lng: 16.8719 },
  bergamo: { lat: 45.6983, lng: 9.6773 },
  brescia: { lat: 45.5416, lng: 10.2118 },
  padua: { lat: 45.4064, lng: 11.8768 },
  other: { lat: 42.5, lng: 12.5 },
};

type POI = LatLng & {
  key: string;
  label: string;
  icon?: 'grocery' | 'university' | 'metro' | 'bus';
  metroName?: string;
  metroLines?: string[];
  busLines?: string[];
};

const TURIN_POIS: POI[] = [
  { key: 'lidl', label: 'فروشگاه لیدل', lat: 45.0636, lng: 7.6826, icon: 'grocery' },
  { key: 'carrefour', label: 'فروشگاه کرفور', lat: 45.0707, lng: 7.6869, icon: 'grocery' },
  { key: 'ins', label: 'فروشگاه اینس', lat: 45.0605, lng: 7.6762, icon: 'grocery' },
  { key: 'polito', label: 'دانشگاه پلی‌تکنیک تورین', lat: 45.0622, lng: 7.6628, icon: 'university' },
  { key: 'unito', label: 'دانشگاه UniTo', lat: 45.0698, lng: 7.6936, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 45.0625, lng: 7.6781, icon: 'metro', metroName: 'Porta Nuova', metroLines: ['M1'] },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 45.0676, lng: 7.6702, icon: 'bus', busLines: ['۴', '۱۱', '۱۵'] },
];

const POIS_BY_CITY: Record<string, POI[]> = {
  turin: TURIN_POIS,
};

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function computeHousingNearby(city: string, point?: LatLng | null) {
  if (!point) return [];
  const pois = POIS_BY_CITY[city] || [];

  return pois.map((poi) => {
    const distanceKm = Number(haversineKm(point, poi).toFixed(2));
    const driveMinutes = Math.max(1, Math.round((distanceKm / 28) * 60));
    const walkMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));
    return {
      key: poi.key,
      label: poi.label,
      distanceKm,
      driveMinutes,
      walkMinutes,
      icon: poi.icon,
      metroName: poi.metroName,
      metroLines: poi.metroLines,
      busLines: poi.busLines,
    };
  });
}
