import { NextRequest, NextResponse } from 'next/server';
import { AIVisibilityChecker } from '@/lib/seo/ai-visibility';

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const normalized = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const checker = new AIVisibilityChecker(normalized);

    const result = await checker.check();

    return NextResponse.json({ success: true, domain: normalized, result });
  } catch (error) {
    console.error('AI visibility check error:', error);
    return NextResponse.json({ error: 'Failed to check AI visibility' }, { status: 500 });
  }
}
