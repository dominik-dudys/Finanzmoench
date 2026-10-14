import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToBuffer(secret: string): Buffer {
  const clean = secret.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) throw new Error(`Ungültiges Base32-Zeichen: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function totp(secret: string, timestamp = Date.now(), period = 30, digits = 6): string {
  const counter = Math.floor(timestamp / 1000 / period);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32ToBuffer(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

export async function freshTotp(secret: string, used: Set<string>, period = 30): Promise<string> {
  for (;;) {
    const secondsLeft = period - (Math.floor(Date.now() / 1000) % period);
    const code = totp(secret);
    if (!used.has(code) && secondsLeft > 3) {
      used.add(code);
      return code;
    }
    await new Promise((resolve) => setTimeout(resolve, (secondsLeft + 1) * 1000));
  }
}
