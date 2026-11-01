import { ARISE_TOPIC_IDS } from './arise.js';

export function mediaUrl(id) {
  if (id !== 'book' && !ARISE_TOPIC_IDS.includes(id)) throw new Error('Unknown Arise media');
  return './arise-media/' + id + '.enc.json';
}

export function mediaBlob(media, id) {
  const mime = id === 'book' ? 'application/pdf' : 'image/png';
  if (media?.mime !== mime || typeof media.base64 !== 'string') throw new Error('Invalid Arise media');
  const bytes = Uint8Array.from(atob(media.base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}
