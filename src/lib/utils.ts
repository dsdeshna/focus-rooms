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
  const array = new Uint32Array(1);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Server-side / Node.js
    const crypto = require('crypto');
    // In Node 14.17.0+ and Node 15+, webcrypto is preferred
    const webcrypto = crypto.webcrypto;
    if (webcrypto && webcrypto.getRandomValues) {
      webcrypto.getRandomValues(array);
    } else {
      // Fallback for older Node environments (still CSPRNG)
      const randomInt = crypto.randomInt;
      return randomInt(0, 0xFFFFFFFF) / (0xFFFFFFFF + 1);
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
