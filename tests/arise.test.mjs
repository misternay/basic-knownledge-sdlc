import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEdition, checkParity, filterQuestions, grade } from '../src/lib/arise.js';
import { open, seal } from '../src/lib/vault.js';

const q = (over) => ({ id: 'q1', type: 'single', stem: 's', choices: ['a', 'b', 'c'], reasons: ['ra', 'rb', 'rc'], answer: [1], topics: [0], source: 'practice', alignment: 'direct', ...over });
const edition = (questions) => ({ topics: ['T'], topicIds: ['sql'], learning: [{}], questions });

test('grade: single, multi all-or-nothing, order exact', () => {
  assert.equal(grade(q(), [1]), true);
  assert.equal(grade(q(), [0]), false);
  const multi = q({ type: 'multi', answer: [0, 2] });
  assert.equal(grade(multi, [2, 0]), true);
  assert.equal(grade(multi, [0]), false);
  assert.equal(grade(multi, [0, 1, 2]), false);
  const order = q({ type: 'order', answer: [2, 0, 1] });
  assert.equal(grade(order, [2, 0, 1]), true);
  assert.equal(grade(order, [0, 2, 1]), false);
  assert.equal(grade(q({ scored: false }), [1]), null);
});

test('filter by topic, origin and alignment', () => {
  const list = [q({ id: 'a', origin: 'sheet' }), q({ id: 'b', origin: 'docs', topics: [1], alignment: 'related' }), q({ id: 'c' })];
  const ids = (f) => filterQuestions(list, { topic: 'all', source: 'all', alignment: 'all', ...f }).map((x) => x.id);
  assert.deepEqual(ids({}), ['a', 'b', 'c']);
  assert.deepEqual(ids({ source: 'sheet' }), ['a']);
  assert.deepEqual(ids({ topic: '1' }), ['b']);
  assert.deepEqual(ids({ alignment: 'related' }), ['b']);
});

test('checkEdition catches broken answers and reasons', () => {
  assert.deepEqual(checkEdition(edition([q()])), []);
  assert.ok(checkEdition(edition([q({ answer: [5] })])).length);
  assert.ok(checkEdition(edition([q({ reasons: ['x'] })])).length);
  assert.ok(checkEdition(edition([q({ type: 'order', answer: [0, 1] })])).length);
  assert.ok(checkEdition(edition([q(), q()])).some((e) => e.includes('duplicate')));
});

test('checkParity requires matching ids and answers', () => {
  assert.deepEqual(checkParity(edition([q()]), edition([q({ stem: 'en' })])), []);
  assert.ok(checkParity(edition([q()]), edition([q({ answer: [2] })])).length);
});

test('vault round trip, wrong passphrase fails', async () => {
  const value = { th: { text: 'ภาษาไทย' }, n: [1, 2, 3] };
  const envelope = await seal(value, 'right', 1000);
  assert.ok(!JSON.stringify(envelope).includes('ภาษาไทย'));
  assert.deepEqual(await open(envelope, 'right'), value);
  await assert.rejects(open(envelope, 'wrong'));
});
