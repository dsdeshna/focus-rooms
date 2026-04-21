import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cryptographically secure random number generator.
 * Returns a value between 0 (inclusive) and 1 (exclusive),
 */
export function cryptoRandom(): number {
  if (typeof globalThis !== 'undefined') {
    const crypto = globalThis.crypto || (globalThis as any).msCrypto;
    if (crypto && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1);
    }
  }
  
  // Server-side / Node.js
  const crypto = require('crypto');
  const buf = crypto.randomBytes(4);
  return buf.readUInt32LE(0) / (0xFFFFFFFF + 1);
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
