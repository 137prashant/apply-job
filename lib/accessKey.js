import { timingSafeEqual } from 'crypto';

function getAccessKeys() {
  return (process.env.APP_ACCESS_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function isValidAccessKey(inputKey) {
  if (!inputKey || typeof inputKey !== 'string') {
    return false;
  }

  const keys = getAccessKeys();
  if (keys.length === 0) {
    return false;
  }

  return keys.some((key) => safeCompare(inputKey, key));
}
