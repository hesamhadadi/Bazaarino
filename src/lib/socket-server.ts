import type { Server as IOServer } from 'socket.io';

type GlobalWithSocket = typeof globalThis & {
  __bazaarinoIO?: IOServer;
};

function getGlobal() {
  return globalThis as GlobalWithSocket;
}

export function setSocketServer(io: IOServer) {
  getGlobal().__bazaarinoIO = io;
}

export function getSocketServer() {
  return getGlobal().__bazaarinoIO;
}

export function emitToUsers(userIds: string[], event: string, payload: Record<string, any>) {
  const io = getSocketServer();
  if (!io) return;
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

export function emitToConversation(conversationId: string, event: string, payload: Record<string, any>) {
  const io = getSocketServer();
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit(event, payload);
}

export function emitGlobal(event: string, payload: Record<string, any>) {
  const io = getSocketServer();
  if (!io) return;
  io.emit(event, payload);
}
