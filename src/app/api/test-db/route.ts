import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: '✅ اتصال موفق به MongoDB' });
  } catch (error: any) {
    return NextResponse.json({ 
      status: '❌ خطا',
      message: error.message,
      type: error.name,
    }, { status: 500 });
  }
}