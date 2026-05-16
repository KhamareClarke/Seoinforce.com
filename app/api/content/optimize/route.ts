import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { optimizeContent } from '@/lib/seo/content-optimizer';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const targetKeyword =
      typeof body.targetKeyword === 'string' ? body.targetKeyword.trim() : '';

    if (!url || !targetKeyword) {
      return NextResponse.json(
        { error: 'url and targetKeyword are required' },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const result = await optimizeContent({
      url: parsed.toString(),
      targetKeyword,
      location: body.location,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content optimize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Optimization failed' },
      { status: 500 }
    );
  }
}
