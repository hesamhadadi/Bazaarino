import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CommentsModeration from './CommentsModeration';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'editor'].includes(session.user.role)) redirect('/');

  const status =
    searchParams?.status === 'approved' ||
    searchParams?.status === 'rejected' ||
    searchParams?.status === 'all'
      ? searchParams.status
      : 'pending';

  return <CommentsModeration initialStatus={status} />;
}
