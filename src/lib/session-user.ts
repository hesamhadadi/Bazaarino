import User from '@/models/User';
import mongoose from 'mongoose';

type SessionUserLike = {
  id?: string;
  email?: string | null;
};

export async function resolveSessionUserId(user?: SessionUserLike): Promise<string | null> {
  if (user?.id && mongoose.Types.ObjectId.isValid(user.id)) {
    return user.id;
  }

  const normalizedEmail = user?.email?.toLowerCase().trim();
  if (!normalizedEmail) {
    return null;
  }

  const dbUser = await User.findOne({ email: normalizedEmail })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }>();
  if (!dbUser) {
    return null;
  }

  return dbUser._id.toString();
}
