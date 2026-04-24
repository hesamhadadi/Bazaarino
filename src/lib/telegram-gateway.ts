/**
 * Telegram Gateway API client (https://gateway.telegram.org/).
 *
 * Free for users who already have Telegram. Delivers 6-digit codes
 * inside Telegram itself (via @VerificationCodes chat).
 *
 * Docs: https://core.telegram.org/gateway/api
 */

const BASE = 'https://gatewayapi.telegram.org';

function getToken(): string | null {
  return (process.env.TELEGRAM_GATEWAY_TOKEN || '').trim() || null;
}

async function call<T = any>(method: string, body: Record<string, any>): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('TELEGRAM_GATEWAY_TOKEN not configured');
  }
  const res = await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    // Gateway may be slow; give it enough time.
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const error = data?.error || `HTTP ${res.status}`;
    throw new Error(`Telegram Gateway ${method} failed: ${error}`);
  }
  return data?.result as T;
}

export function isGatewayConfigured(): boolean {
  return Boolean(getToken());
}

/** Check whether Telegram can deliver to a phone number. */
export async function checkSendAbility(phone: string): Promise<{ canSend: boolean; requestId?: string }> {
  try {
    const result: any = await call('checkSendAbility', { phone_number: phone });
    return { canSend: true, requestId: result?.request_id };
  } catch (err: any) {
    return { canSend: false };
  }
}

/**
 * Send a numeric verification code to the given phone via Telegram.
 * Returns the request_id for later verification, or null on failure.
 */
export async function sendTelegramCode(phone: string, code: string): Promise<string | null> {
  try {
    const result: any = await call('sendVerificationMessage', {
      phone_number: phone,
      code,
      ttl: 300,
    });
    return result?.request_id || null;
  } catch (err) {
    console.error('[telegram-gateway] sendVerificationMessage error:', err);
    return null;
  }
}
