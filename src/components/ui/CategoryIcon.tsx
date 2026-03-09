import { Home, Car, Smartphone, Sofa, BriefcaseBusiness, Wrench, Shirt, Apple, ToyBrick, Package } from 'lucide-react';
import clsx from 'clsx';

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, any> = {
  'real-estate': Home,
  vehicles: Car,
  electronics: Smartphone,
  'home-appliances': Sofa,
  jobs: BriefcaseBusiness,
  services: Wrench,
  clothing: Shirt,
  food: Apple,
  kids: ToyBrick,
  other: Package,
};

export default function CategoryIcon({ categoryId, size = 20, className }: CategoryIconProps) {
  const Icon = iconMap[categoryId] || Package;
  return <Icon size={size} className={clsx('stroke-[2.1]', className)} />;
}
