import { createHmac, timingSafeEqual } from 'crypto';

export function verifyShopifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
  const digest = createHmac('sha256', secret).update(payload).digest('base64');
  const signatureBuffer = Buffer.from(signature, 'base64');
  const digestBuffer = Buffer.from(digest, 'base64');
  if (signatureBuffer.length !== digestBuffer.length) return false;
  return timingSafeEqual(signatureBuffer, digestBuffer);
}
