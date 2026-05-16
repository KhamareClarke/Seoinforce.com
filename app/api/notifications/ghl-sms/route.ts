import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  sendSmsForUserEvent,
  type GhlSmsEventType,
  type GhlSmsTemplateVars,
} from '@/lib/ghl/sms';

export const dynamic = 'force-dynamic';

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

function verifyInternalSecret(request: NextRequest): boolean {
  const secret = (process.env.GHL_NOTIFICATION_SECRET ?? '').trim();
  if (!secret) return false;
  const header = request.headers.get('x-seoinforce-internal')?.trim();
  return header === secret;
}

const ALLOWED_EVENTS: GhlSmsEventType[] = [
  'audit_completion',
  'rank_drop',
  'rank_gain',
  'competitor_alert',
  'subscription_renewal',
  'subscription_upgraded',
  'subscription_downgraded',
  'report_ready',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event,
      userId: bodyUserId,
      vars = {},
    } = body as {
      event?: string;
      userId?: string;
      vars?: GhlSmsTemplateVars;
    };

    if (!event || !ALLOWED_EVENTS.includes(event as GhlSmsEventType)) {
      return NextResponse.json(
        { error: 'Invalid or missing event', allowed: ALLOWED_EVENTS },
        { status: 400 }
      );
    }

    let userId: string | null = null;

    if (verifyInternalSecret(request)) {
      if (!bodyUserId || typeof bodyUserId !== 'string') {
        return NextResponse.json(
          { error: 'userId required when using internal secret' },
          { status: 400 }
        );
      }
      userId = bodyUserId;
    } else {
      const user = await getCurrentUser(request);
      if (!user) return unauthorized();
      if (bodyUserId && bodyUserId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      userId = user.id;
    }

    if (!userId) return unauthorized();

    const result = await sendSmsForUserEvent({
      userId,
      event: event as GhlSmsEventType,
      vars: vars || {},
    });

    return NextResponse.json({
      success: result.ok,
      skipped: result.skipped,
      ghlMessageId: result.ghlMessageId,
      conversationId: result.conversationId,
      error: result.error,
      event: result.event,
      userId: result.userId,
    });
  } catch (e) {
    console.error('ghl-sms route', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
