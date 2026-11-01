// The Arise practice set: 168 questions from an earlier study site, kept in
// their original shape (single / multi / order, a reason for every choice).
// Plaintext lives in private/ (git-excluded); the site only ships
// public/arise.enc.json, unlocked with a passphrase. See scripts/encrypt-arise.mjs.

export const ARISE_URL = './arise.enc.json';

// Our topic ids that have Arise questions, in the set's own topic order.
export const ARISE_TOPIC_IDS = ['sql', 'design', 'sec', 'ctx', 'skills', 'prog', 'git', 'cicd', 'qa', 'docker', 'workflow', 'agents', 'dev', 'llm'];

// Ported from the original site: multi is all-or-nothing, order must match exactly.
export function grade(question, selected) {
  if (question.answer === null || question.scored === false) return null;
  const expected = question.answer;
  if (selected.length !== expected.length) return false;
  return question.type === 'order'
    ? selected.every((value, index) => value === expected[index])
    : expected.every((value) => selected.includes(value));
}

// filter: { topic: 'all' | index, source: 'all' | 'sheet' | 'docs', alignment: 'all' | 'direct' | 'related' }
export function filterQuestions(questions, filter) {
  return questions.filter((q) =>
    (filter.topic === 'all' || q.topics.includes(Number(filter.topic)))
    && (filter.source === 'all' || q.source === filter.source || q.origin === filter.source)
    && (filter.alignment === 'all' || q.alignment === filter.alignment));
}

export const answerLabel = (q) => q.answer.map((i) => 'ABCDEF'[i]).join(q.type === 'order' ? ' → ' : ' + ');

// Structural checks for one language edition. Returns a list of problems.
export function checkEdition(d) {
  const errors = [];
  const n = d.topics?.length || 0;
  if (!n) errors.push('topics: empty');
  if (d.topicIds?.length !== n) errors.push('topicIds: length must match topics');
  if (d.learning?.length !== n) errors.push('learning: length must match topics');
  if (d.cheatsheet) {
    if (d.cheatsheet.length !== n) errors.push('cheatsheet: one chapter per topic');
    d.cheatsheet.forEach((c, i) => {
      const text = (s) => typeof s === 'string' && s.trim();
      const ok = c && text(c.story) && typeof c.mnemonic === 'string' && c.groups?.length
        && c.groups.every((g) => text(g.title) && g.items?.length
          && g.items.every((it) => text(it.key) && text(it.rule) && (it.trap === undefined || text(it.trap))));
      if (!ok) errors.push('cheatsheet ' + i + ': needs story, mnemonic and groups of items with key and rule');
    });
  }
  const ids = new Set();
  for (const q of d.questions || []) {
    const at = 'question ' + q.id + ': ';
    if (ids.has(q.id)) errors.push(at + 'duplicate id');
    ids.add(q.id);
    if (!q.stem) errors.push(at + 'missing stem');
    if (!['single', 'multi', 'order'].includes(q.type)) errors.push(at + 'unknown type ' + q.type);
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(at + 'needs at least 2 choices');
    if (q.reasons?.length !== q.choices?.length) errors.push(at + 'reasons must match choices');
    if (!q.topics?.length || q.topics.some((t) => !(t >= 0 && t < n))) errors.push(at + 'bad topics');
    if (q.answer === null) continue;
    const a = q.answer || [];
    if (a.some((i) => !(Number.isInteger(i) && i >= 0 && i < q.choices.length)) || new Set(a).size !== a.length) errors.push(at + 'bad answer');
    if (q.type === 'single' && a.length !== 1) errors.push(at + 'single needs one answer');
    if (q.type === 'multi' && !a.length) errors.push(at + 'multi needs an answer');
    if (q.type === 'order' && a.length !== q.choices.length) errors.push(at + 'order answer must be a permutation');
  }
  if (d.recommended) {
    const r = d.recommended;
    const text = (s) => typeof s === 'string' && s.trim();
    if (!text(r.title) || !text(r.intro) || !r.items?.length) errors.push('recommended: needs title, intro and items');
    const itemIds = new Set();
    for (const item of r.items || []) {
      if (!text(item.id) || itemIds.has(item.id)) errors.push('recommended: invalid or duplicate item id');
      itemIds.add(item.id);
      if (!text(item.title) || !text(item.body) || !Number.isInteger(item.topic) || item.topic < 0 || item.topic >= n) errors.push('recommended: invalid reading');
      if (!item.refs?.length || item.refs.some((url) => typeof url !== 'string' || !url.startsWith('https://'))) errors.push('recommended: missing source');
    }
    const selected = r.questionIds || [];
    if (!selected.length || new Set(selected).size !== selected.length || selected.some((id) => !d.questions?.some((q) => q.id === id && q.recommended === true))) errors.push('recommended: invalid practice question ids');
  }
  return errors;
}

// The English edition must line up with the Thai one item by item.
export function checkParity(th, en) {
  const errors = [];
  if (th.questions.length !== en.questions.length) return ['question count differs'];
  th.questions.forEach((q, i) => {
    const e = en.questions[i];
    if (e.id !== q.id) errors.push('question ' + i + ': id differs');
    else if (e.type !== q.type || JSON.stringify(e.answer) !== JSON.stringify(q.answer) || e.choices.length !== q.choices.length) errors.push('question ' + q.id + ': type, answer or choices differ');
  });
  // Same groups, items, traps and mnemonic presence in both languages.
  const shape = (c) => c && JSON.stringify([Boolean(c.mnemonic), c.groups?.map((g) => g.items?.map((it) => it.trap !== undefined))]);
  (th.cheatsheet || []).forEach((c, i) => {
    if (shape(en.cheatsheet?.[i]) !== shape(c)) errors.push('cheatsheet ' + i + ': structure differs');
  });
  const recommendationShape = (d) => d.recommended ? {
    items: d.recommended.items?.map((item) => [item.id, item.topic, item.code || null, item.refs]),
    questions: d.recommended.questionIds,
  } : null;
  if (JSON.stringify(recommendationShape(th)) !== JSON.stringify(recommendationShape(en))) errors.push('recommended: structure differs');
  th.questions.forEach((q, i) => {
    if (Boolean(q.recommended) !== Boolean(en.questions[i]?.recommended)) errors.push('question ' + q.id + ': recommendation differs');
  });
  return errors;
}
