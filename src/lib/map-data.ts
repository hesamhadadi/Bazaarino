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
  berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1371, lng: 11.5754 },
  hamburg: { lat: 53.5511, lng: 9.9937 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  birmingham: { lat: 52.4862, lng: -1.8904 },
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

const berlinPois: POI[] = [
  { key: 'aldi', label: 'فروشگاه Aldi', lat: 52.5215, lng: 13.39, icon: 'grocery' },
  { key: 'rewe', label: 'فروشگاه Rewe', lat: 52.517, lng: 13.41, icon: 'grocery' },
  { key: 'edeka', label: 'فروشگاه Edeka', lat: 52.526, lng: 13.415, icon: 'grocery' },
  { key: 'tu-berlin', label: 'دانشگاه TU Berlin', lat: 52.512, lng: 13.326, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 52.52, lng: 13.405, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 52.523, lng: 13.398, icon: 'bus' },
];

const munichPois: POI[] = [
  { key: 'aldi', label: 'فروشگاه Aldi', lat: 48.138, lng: 11.57, icon: 'grocery' },
  { key: 'rewe', label: 'فروشگاه Rewe', lat: 48.135, lng: 11.58, icon: 'grocery' },
  { key: 'edeka', label: 'فروشگاه Edeka', lat: 48.14, lng: 11.56, icon: 'grocery' },
  { key: 'lmu', label: 'دانشگاه LMU', lat: 48.15, lng: 11.58, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 48.137, lng: 11.575, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 48.134, lng: 11.572, icon: 'bus' },
];

const hamburgPois: POI[] = [
  { key: 'aldi', label: 'فروشگاه Aldi', lat: 53.551, lng: 10.0, icon: 'grocery' },
  { key: 'rewe', label: 'فروشگاه Rewe', lat: 53.548, lng: 9.99, icon: 'grocery' },
  { key: 'edeka', label: 'فروشگاه Edeka', lat: 53.554, lng: 9.985, icon: 'grocery' },
  { key: 'uni-hh', label: 'دانشگاه هامبورگ', lat: 53.56, lng: 9.985, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 53.552, lng: 9.995, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 53.553, lng: 9.989, icon: 'bus' },
];

const frankfurtPois: POI[] = [
  { key: 'aldi', label: 'فروشگاه Aldi', lat: 50.111, lng: 8.68, icon: 'grocery' },
  { key: 'rewe', label: 'فروشگاه Rewe', lat: 50.114, lng: 8.685, icon: 'grocery' },
  { key: 'edeka', label: 'فروشگاه Edeka', lat: 50.108, lng: 8.676, icon: 'grocery' },
  { key: 'goethe', label: 'دانشگاه Goethe', lat: 50.127, lng: 8.651, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 50.11, lng: 8.682, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 50.109, lng: 8.689, icon: 'bus' },
];

const colognePois: POI[] = [
  { key: 'aldi', label: 'فروشگاه Aldi', lat: 50.937, lng: 6.96, icon: 'grocery' },
  { key: 'rewe', label: 'فروشگاه Rewe', lat: 50.934, lng: 6.965, icon: 'grocery' },
  { key: 'edeka', label: 'فروشگاه Edeka', lat: 50.94, lng: 6.955, icon: 'grocery' },
  { key: 'uni-koeln', label: 'دانشگاه کلن', lat: 50.924, lng: 6.928, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو', lat: 50.936, lng: 6.96, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 50.939, lng: 6.962, icon: 'bus' },
];

const londonPois: POI[] = [
  { key: 'tesco', label: 'فروشگاه Tesco', lat: 51.507, lng: -0.12, icon: 'grocery' },
  { key: 'sains', label: "فروشگاه Sainsbury's", lat: 51.51, lng: -0.13, icon: 'grocery' },
  { key: 'asda', label: 'فروشگاه ASDA', lat: 51.505, lng: -0.11, icon: 'grocery' },
  { key: 'ucl', label: 'دانشگاه UCL', lat: 51.524, lng: -0.134, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو (Tube)', lat: 51.507, lng: -0.128, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 51.508, lng: -0.13, icon: 'bus' },
];

const manchesterPois: POI[] = [
  { key: 'tesco', label: 'فروشگاه Tesco', lat: 53.48, lng: -2.24, icon: 'grocery' },
  { key: 'sains', label: "فروشگاه Sainsbury's", lat: 53.482, lng: -2.245, icon: 'grocery' },
  { key: 'asda', label: 'فروشگاه ASDA', lat: 53.478, lng: -2.238, icon: 'grocery' },
  { key: 'man-uni', label: 'دانشگاه منچستر', lat: 53.466, lng: -2.233, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو (Tram)', lat: 53.48, lng: -2.24, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 53.481, lng: -2.246, icon: 'bus' },
];

const birminghamPois: POI[] = [
  { key: 'tesco', label: 'فروشگاه Tesco', lat: 52.486, lng: -1.89, icon: 'grocery' },
  { key: 'sains', label: "فروشگاه Sainsbury's", lat: 52.488, lng: -1.892, icon: 'grocery' },
  { key: 'asda', label: 'فروشگاه ASDA', lat: 52.484, lng: -1.888, icon: 'grocery' },
  { key: 'bham-uni', label: 'دانشگاه بیرمنگام', lat: 52.45, lng: -1.93, icon: 'university' },
  { key: 'metro', label: 'ایستگاه مترو (Tram)', lat: 52.485, lng: -1.89, icon: 'metro' },
  { key: 'bus', label: 'ایستگاه اتوبوس', lat: 52.487, lng: -1.893, icon: 'bus' },
];

const POIS_BY_CITY: Record<string, POI[]> = {
  turin: TURIN_POIS,
  berlin: berlinPois,
  munich: munichPois,
  hamburg: hamburgPois,
  frankfurt: frankfurtPois,
  cologne: colognePois,
  london: londonPois,
  manchester: manchesterPois,
  birmingham: birminghamPois,
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
