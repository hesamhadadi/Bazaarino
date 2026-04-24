import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { Mail, Send, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'راه‌های ارتباط با تیم بازارینو.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">تماس با ما</h1>
        <p className="text-gray-600 leading-8 mb-6">
          تیم پشتیبانی بازارینو از طریق راه‌های زیر در دسترس شماست. معمولاً ظرف ۲۴ ساعت پاسخ می‌دهیم.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <a href="mailto:support@bazaarino.online" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Mail size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">ایمیل</h2>
            <p className="text-sm text-gray-600">support@bazaarino.online</p>
          </a>
          <a href="https://t.me/bazaarino" target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Send size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">تلگرام</h2>
            <p className="text-sm text-gray-600">@bazaarino</p>
          </a>
          <a href="https://wa.me/000000000000" target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <MessageCircle size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">واتساپ</h2>
            <p className="text-sm text-gray-600">پیام مستقیم پشتیبانی</p>
          </a>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
