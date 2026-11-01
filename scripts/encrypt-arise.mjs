// Encrypts private/arise/{th,en}.json into public/arise.enc.json.
// The plaintext folder is git-excluded; only the ciphertext is committed.
//   ARISE_PASSCODE='...' node scripts/encrypt-arise.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { checkEdition, checkParity } from '../src/lib/arise.js';
import { open, seal } from '../src/lib/vault.js';
import { readPassphrase } from './encrypt-arise-media.mjs';

const passphrase = await readPassphrase();
try {
  await open(JSON.parse(readFileSync(new URL('../public/arise.enc.json', import.meta.url), 'utf8')), passphrase);
} catch {
  console.error('The passphrase did not unlock the existing Arise set. No files were changed.');
  process.exit(1);
}

const read = (file) => JSON.parse(readFileSync(new URL('../private/arise/' + file, import.meta.url), 'utf8'));
const editions = { th: read('th.json'), en: read('en.json') };

const errors = [
  ...checkEdition(editions.th).map((e) => 'th ' + e),
  ...checkEdition(editions.en).map((e) => 'en ' + e),
  ...checkParity(editions.th, editions.en),
];
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const envelope = await seal(editions, passphrase);
const back = await open(envelope, passphrase);
if (JSON.stringify(back) !== JSON.stringify(editions)) throw new Error('round trip failed');
writeFileSync(new URL('../public/arise.enc.json', import.meta.url), JSON.stringify(envelope) + '\n');
console.log(`Encrypted ${editions.th.questions.length} questions (th + en) into public/arise.enc.json`);
