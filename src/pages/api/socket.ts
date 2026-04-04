import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiResponseServerIO } from '@/types/socket';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { setSocketServer } from '@/lib/socket-server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      const uid = String(socket.handshake.auth?.userId || '');
      if (uid) {
        socket.join(`user:${uid}`);
        connectDB()
          .then(() => User.findByIdAndUpdate(uid, { $set: { lastSeenAt: new Date() } }))
          .catch(() => undefined);
      }

      socket.on('join_conversation', (conversationId: string) => {
        if (!conversationId) return;
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId: string) => {
        if (!conversationId) return;
        socket.leave(`conversation:${conversationId}`);
      });

      socket.on('typing', ({ conversationId, userId }) => {
        if (!conversationId || !userId) return;
        socket.to(`conversation:${conversationId}`).emit('user_typing', { conversationId, userId });
      });

      socket.on('disconnect', () => {
        if (!uid) return;
        connectDB()
          .then(() => User.findByIdAndUpdate(uid, { $set: { lastSeenAt: new Date() } }))
          .catch(() => undefined);
      });
    });

    res.socket.server.io = io;
    setSocketServer(io);
  }

  res.end();
}
