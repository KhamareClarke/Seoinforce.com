import { makeGhlRequest } from './client';
import { isGhlConfigured } from './client';

export type SendGhlEmailResult = {
  ok: boolean;
  messageId?: string;
  conversationId?: string;
  raw?: unknown;
  error?: string;
};

/**
 * Send a one-off email through GHL Conversations (same endpoint as SMS).
 * Requires a GHL contactId. Open/click tracking is handled by GHL when the sub-account has it enabled.
 *
 * @see https://marketplace.gohighlevel.com/docs/ghl/conversations/send-a-new-message/
 */
export async function sendGhlEmailMessage(params: {
  contactId: string;
  subject: string;
  html: string;
  /** Plain-text fallback (recommended) */
  text?: string;
}): Promise<SendGhlEmailResult> {
  if (!isGhlConfigured()) {
    return { ok: false, error: 'GHL not configured' };
  }

  try {
    const payload: Record<string, unknown> = {
      type: 'Email',
      contactId: params.contactId,
      subject: params.subject,
      html: params.html,
    };
    if (params.text) payload.message = params.text;

    const data = await makeGhlRequest<Record<string, unknown>>('/conversations/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const messageId =
      (data.messageId as string) ||
      (data.id as string) ||
      (data.emailMessageId as string | undefined);

    return {
      ok: true,
      messageId: typeof messageId === 'string' ? messageId : undefined,
      conversationId: data.conversationId as string | undefined,
      raw: data,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Optional: fetch a sent email record (IDs from send response / webhooks).
 * @see https://marketplace.gohighlevel.com/docs/ghl/conversations/get-email-by-id
 */
export async function getGhlEmailById(emailMessageId: string): Promise<Record<string, unknown> | null> {
  if (!isGhlConfigured()) return null;
  try {
    return await makeGhlRequest<Record<string, unknown>>(`/conversations/messages/email/${emailMessageId}`, {
      method: 'GET',
    });
  } catch {
    return null;
  }
}
