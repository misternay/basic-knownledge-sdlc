// Passphrase-encrypted content for the public repo: gzip, then AES-GCM with a
// key derived by PBKDF2-SHA256. Runs unchanged in Node 20+ and the browser.
const ITERATIONS = 250000;

const toBase64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

async function deriveKey(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function seal(value, passphrase, iterations = ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(value)), new CompressionStream('gzip'));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, packed));
  return { v: 1, iterations, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data) };
}

// Throws when the passphrase is wrong (AES-GCM authentication fails).
export async function open(envelope, passphrase) {
  if (envelope?.v !== 1) throw new Error('unsupported envelope');
  const key = await deriveKey(passphrase, fromBase64(envelope.salt), envelope.iterations);
  const packed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.data));
  return JSON.parse(new TextDecoder().decode(await pipe(new Uint8Array(packed), new DecompressionStream('gzip'))));
}
