// Publishes ciphertext only. The passphrase is read from the environment or
// requested without echo in an interactive terminal, and is never written.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { ARISE_TOPIC_IDS } from '../src/lib/arise.js';
import { open, seal } from '../src/lib/vault.js';

export async function packMedia({ passphrase, sourceDir, outputDir, ariseEnvelope }) {
  // Confirm the existing Arise password before writing any output.
  await open(ariseEnvelope, passphrase);
  const chapters = JSON.parse(await readFile(join(sourceDir, 'chapters.json'), 'utf8'));
  if (chapters.length !== ARISE_TOPIC_IDS.length) throw new Error('Expected all 14 chapters');
  const sources = [];
  for (const [i, id] of ARISE_TOPIC_IDS.entries()) {
    const chapter = chapters[i];
    const expected = `${String(i + 1).padStart(2, '0')}-${id}-overview-a4.png`;
    if (chapter.chapter !== i + 1 || chapter.file !== expected) throw new Error('Chapter order or filename differs');
    sources.push({ id, mime: 'image/png', path: join(sourceDir, expected) });
  }
  sources.push({ id: 'book', mime: 'application/pdf', path: join(sourceDir, 'Arise-14-chapters-A4.pdf') });
  // Validate all inputs before writing any assets.
  const assets = await Promise.all(sources.map(async (source) => {
    const bytes = await readFile(source.path);
    const signature = source.id === 'book' ? Buffer.from('%PDF-') : Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!bytes.subarray(0, signature.length).equals(signature)) throw new Error('Invalid media file: ' + source.id);
    return { ...source, base64: bytes.toString('base64') };
  }));
  await mkdir(outputDir, { recursive: true });
  for (const asset of assets) {
    const envelope = await seal({ mime: asset.mime, base64: asset.base64 }, passphrase);
    // A round trip checks the actual bytes that will be served.
    const back = await open(envelope, passphrase);
    if (back.mime !== asset.mime || back.base64 !== asset.base64) throw new Error('Media round trip failed');
    await writeFile(join(outputDir, asset.id + '.enc.json'), JSON.stringify(envelope) + '\n');
  }
  return assets.length;
}

export async function readPassphrase() {
  if (process.env.ARISE_PASSCODE) return process.env.ARISE_PASSCODE;
  if (!process.stdin.isTTY) throw new Error('Run in a terminal, or set ARISE_PASSCODE in the environment.');
  process.stdout.write('Existing Arise passphrase (hidden): ');
  execFileSync('stty', ['-echo'], { stdio: 'inherit' });
  const input = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const interrupt = () => { execFileSync('stty', ['echo'], { stdio: 'inherit' }); process.stdout.write('\n'); process.exit(130); };
  process.once('SIGINT', interrupt);
  try { return await input.question(''); }
  finally { process.removeListener('SIGINT', interrupt); input.close(); execFileSync('stty', ['echo'], { stdio: 'inherit' }); process.stdout.write('\n'); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  try {
    const count = await packMedia({
      passphrase: await readPassphrase(),
      sourceDir: join(root, 'private/arise/infographics'),
      outputDir: join(root, 'public/arise-media'),
      ariseEnvelope: JSON.parse(await readFile(join(root, 'public/arise.enc.json'), 'utf8')),
    });
    console.log(`Encrypted and verified ${count} Arise media files.`);
  } catch {
    console.error('Could not package Arise media. Check the existing passphrase and all 14 source images plus PDF.');
    process.exitCode = 1;
  }
}
