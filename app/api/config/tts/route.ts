import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'default_tts_config' } });
  return NextResponse.json(config ? JSON.parse(config.value) : { provider: 'siliconflow-tts', voice: 'alex' });
}
