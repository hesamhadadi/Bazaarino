import { Megaphone } from 'lucide-react';
import { getAppSettings } from '@/lib/settings';

export default async function AnnouncementBar() {
  const settings = await getAppSettings();
  if (!settings.announcementEnabled || !settings.announcementText.trim()) return null;

  return (
    <div className="w-full bg-gradient-to-l from-orange-500 to-amber-500 text-white text-center text-xs md:text-sm py-2 px-4 flex items-center justify-center gap-2">
      <Megaphone size={14} className="shrink-0" />
      <span className="truncate">{settings.announcementText}</span>
    </div>
  );
}
