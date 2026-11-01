import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packMedia } from '../scripts/encrypt-arise-media.mjs';
import { ARISE_TOPIC_IDS } from '../src/lib/arise.js';
import { mediaBlob, mediaUrl } from '../src/lib/arise-media.js';
import { seal, open } from '../src/lib/vault.js';

test('media URLs are restricted to known chapters and the PDF', () => {
  assert.equal(mediaUrl('sql'), './arise-media/sql.enc.json');
  assert.equal(mediaUrl('book'), './arise-media/book.enc.json');
  assert.throws(() => mediaUrl('../secret'));
});

test('media blobs preserve bytes and reject the wrong content type', async () => {
  const bytes = Buffer.from('sample bytes');
  const media = { mime: 'image/png', base64: bytes.toString('base64') };
  assert.deepEqual(Buffer.from(await mediaBlob(media, 'sql').arrayBuffer()), bytes);
  assert.throws(() => mediaBlob(media, 'book'));
  assert.throws(() => mediaBlob({ mime: 'text/html', base64: 'AA==' }, 'sql'));
});

test('packaging verifies the existing password, preserves all media and publishes only ciphertext', async () => {
  const root = await mkdtemp(join(tmpdir(), 'arise-media-test-'));
  const sourceDir = join(root, 'source');
  const outputDir = join(root, 'out');
  const passphrase = 'test-only-media-password';
  const ariseEnvelope = await seal({ th: {}, en: {} }, passphrase, 1000);
  try {
    await mkdir(sourceDir);
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 42]);
    const chapters = ARISE_TOPIC_IDS.map((id, i) => ({ chapter: i + 1, file: `${String(i + 1).padStart(2, '0')}-${id}-overview-a4.png` }));
    await writeFile(join(sourceDir, 'chapters.json'), JSON.stringify(chapters));
    for (const chapter of chapters) await writeFile(join(sourceDir, chapter.file), png);
    await writeFile(join(sourceDir, 'Arise-14-chapters-A4.pdf'), '%PDF-1.7\nfixture');
    await assert.rejects(packMedia({ passphrase: 'incorrect', sourceDir, outputDir, ariseEnvelope }));
    await assert.rejects(readdir(outputDir));
    assert.equal(await packMedia({ passphrase, sourceDir, outputDir, ariseEnvelope }), 15);
    const files = await readdir(outputDir);
    assert.equal(files.length, 15);
    assert.ok(files.every((file) => file.endsWith('.enc.json')));
    for (const id of [...ARISE_TOPIC_IDS, 'book']) {
      const envelope = JSON.parse(await readFile(join(outputDir, id + '.enc.json'), 'utf8'));
      await assert.rejects(open(envelope, 'incorrect'));
      const media = await open(envelope, passphrase);
      const bytes = Buffer.from(await mediaBlob(media, id).arrayBuffer());
      if (id === 'book') assert.equal(bytes.toString(), '%PDF-1.7\nfixture');
      else assert.deepEqual(bytes, png);
    }
    chapters.reverse();
    await writeFile(join(sourceDir, 'chapters.json'), JSON.stringify(chapters));
    await assert.rejects(packMedia({ passphrase, sourceDir, outputDir, ariseEnvelope }), /Chapter order/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
