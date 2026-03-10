import { Building2, TramFront, Waves, MountainSnow, Landmark, Trees, Castle, MapPin } from 'lucide-react';
import clsx from 'clsx';

interface CityIconProps {
  city: string;
  size?: number;
  className?: string;
}

const cityIconMap: Record<string, any> = {
  rome: Landmark,
  milan: Building2,
  florence: Castle,
  venice: Waves,
  naples: MountainSnow,
  turin: TramFront,
  bologna: Building2,
  genoa: Waves,
  palermo: Trees,
  catania: MountainSnow,
  verona: Castle,
  bari: Waves,
  bergamo: Castle,
  brescia: Building2,
  padua: Landmark,
  berlin: Building2,
  munich: Castle,
  hamburg: Waves,
  frankfurt: Building2,
  cologne: Landmark,
  london: Landmark,
  manchester: Building2,
  birmingham: Building2,
};

export default function CityIcon({ city, size = 13, className }: CityIconProps) {
  const Icon = cityIconMap[city] || MapPin;
  return <Icon size={size} className={clsx('stroke-[2]', className)} />;
}
