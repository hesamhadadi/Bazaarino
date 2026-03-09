import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('ایمیل و رمز عبور الزامی است');
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error('ایمیل یا رمز عبور اشتباه است');
        }

        if (!user.isActive) {
          throw new Error('حساب کاربری شما غیرفعال شده است');
        }

        if (!user.password) {
          throw new Error('رمز عبور تنظیم نشده است');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('ایمیل یا رمز عبور اشتباه است');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email!.toLowerCase() });
          if (!existing) {
            const newUser = await User.create({
              name: user.name,
              email: user.email!.toLowerCase(),
              avatar: user.image,
              role: 'user',
              isActive: true,
            });
            user.id = newUser._id.toString();
          } else {
            user.id = existing._id.toString();
          }
        } catch (err) {
          console.error('Google signIn error:', err);
          // اجازه بده وارد بشه حتی اگه DB خطا داد
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      // Ensure id is always Mongo ObjectId, especially for Google users with provider sub IDs.
      if (token.email && (!token.id || !mongoose.Types.ObjectId.isValid(token.id))) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
