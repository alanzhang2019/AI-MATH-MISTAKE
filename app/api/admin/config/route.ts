import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'default_tts_config' } });
  return NextResponse.json(config ? JSON.parse(config.value) : { provider: 'siliconflow-tts', voice: 'alex' });
}

export async function POST(req: Request) {
  const body = await req.json();
  await prisma.systemConfig.upsert({
    where: { key: 'default_tts_config' },
    update: { value: JSON.stringify(body) },
    create: { key: 'default_tts_config', value: JSON.stringify(body) }
  });
  return NextResponse.json({ success: true });
}
