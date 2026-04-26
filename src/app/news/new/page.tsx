import { redirect } from 'next/navigation';

// Old route — admin article creation now lives at /admin/articles/new.
export default function LegacyNewArticlePage() {
  redirect('/admin/articles/new');
}
