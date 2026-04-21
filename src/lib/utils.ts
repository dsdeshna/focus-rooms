import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cryptographically secure alternative to Math.random().
 * Uses the Web Crypto API on both client and server.
 * Returns a float in [0, 1).
 */
export function cryptoRandom(): number {
  const array = new Uint32Array(1);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Node.js environments without globalThis.crypto (pre-19)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('node:crypto');
    const webcrypto = crypto.webcrypto;
    if (webcrypto?.getRandomValues) {
      webcrypto.getRandomValues(array);
    } else {
      return crypto.randomInt(0, 0xFFFFFFFF) / (0xFFFFFFFF + 1);
    }
  }

  return array[0] / (0xFFFFFFFF + 1);
}

/**
 * Generate a random 6-character room code (uppercase alphanumeric)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(cryptoRandom() * chars.length));
  }
  return code;
}
