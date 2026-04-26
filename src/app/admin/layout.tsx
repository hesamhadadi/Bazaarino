import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'پنل مدیریت',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin');
  }
  if (session.user?.role !== 'admin') {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
