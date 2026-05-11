import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import os from 'os';
import { statfs } from 'fs/promises';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.round((used / total) * 1000) / 10;
}

function statusFromUsage(value: number) {
  if (value >= 92) return 'critical';
  if (value >= 82) return 'warning';
  return 'ok';
}

async function getDiskUsage() {
  const path = process.env.SYSTEM_HEALTH_PATH || process.cwd();
  try {
    const info = await statfs(path);
    const blockSize = Number(info.bsize);
    const total = Number(info.blocks) * blockSize;
    const free = Number(info.bavail) * blockSize;
    const used = Math.max(0, total - free);
    const usedPct = pct(used, total);
    return {
      path,
      total,
      free,
      used,
      usedPct,
      status: statusFromUsage(usedPct),
    };
  } catch (err) {
    return {
      path,
      total: 0,
      free: 0,
      used: 0,
      usedPct: 0,
      status: 'unknown',
      error: err instanceof Error ? err.message : 'Unable to read disk stats',
    };
  }
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = Math.max(0, totalMemory - freeMemory);
  const memoryUsedPct = pct(usedMemory, totalMemory);
  const processMemory = process.memoryUsage();
  const disk = await getDiskUsage();
  const loadAverage = os.loadavg();
  const cpuCount = os.cpus().length || 1;
  const loadPct = Math.round((loadAverage[0] / cpuCount) * 1000) / 10;

  const health = {
    generatedAt: new Date().toISOString(),
    status:
      disk.status === 'critical' || memoryUsedPct >= 92 || loadPct >= 95
        ? 'critical'
        : disk.status === 'warning' || memoryUsedPct >= 82 || loadPct >= 75
          ? 'warning'
          : 'ok',
    disk,
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPct: memoryUsedPct,
      status: statusFromUsage(memoryUsedPct),
    },
    process: {
      uptimeSeconds: Math.round(process.uptime()),
      rss: processMemory.rss,
      heapTotal: processMemory.heapTotal,
      heapUsed: processMemory.heapUsed,
      external: processMemory.external,
      nodeVersion: process.version,
      pid: process.pid,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptimeSeconds: Math.round(os.uptime()),
      cpuCount,
      cpuModel: os.cpus()[0]?.model || 'unknown',
      loadAverage,
      loadPct,
      status: loadPct >= 95 ? 'critical' : loadPct >= 75 ? 'warning' : 'ok',
    },
  };

  return NextResponse.json({ health }, { headers: NO_STORE_HEADERS });
}
