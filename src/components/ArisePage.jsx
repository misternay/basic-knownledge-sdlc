import { useState } from 'react';
import { ARISE_URL, answerLabel, filterQuestions, grade } from '../lib/arise.js';
import { LETTERS, shuffle } from '../lib/random.js';
import { open } from '../lib/vault.js';
import { useI18n } from '../i18n.jsx';
import { Badge, Progress, Code } from './ui.jsx';
import AriseConceptMap from './AriseConceptMap.jsx';
import AriseInfographics from './AriseInfographics.jsx';

// #/arise · #/arise/learn · #/arise/sheet · #/arise/infographics · #/arise/topic/<id>
// data and results live in App memory only: a refresh asks for the passphrase again.
export default function ArisePage({ data, onUnlock, results, setResults, view, topicId }) {
  const { language, t } = useI18n();
  if (!data) return <Unlock onUnlock={onUnlock} />;
  const set = data[language] || data.th;
  const tab = ['learn', 'sheet', 'infographics', 'recommended', 'recommended-practice'].includes(view) ? view : 'practice';
  return (
    <div className="stack-24">
      <div className="stack-6">
        <h1 className="h1">{t('ชุดฝึก Arise', 'Arise practice set')}</h1>
        <p className="lead">{t(
          `${set.questions.length} ข้อ รวมชุดฝึกเดิมและข้อฝึกแต่งเพิ่ม พร้อมเหตุผลของทุกตัวเลือก คำตอบเก็บไว้แค่จนกว่าจะรีเฟรชหน้า`,
          `${set.questions.length} questions combining the original set and additional practice, with a reason for every choice. Answers are kept only until you refresh.`,
        )}</p>
      </div>
      <nav className="tabs no-print" aria-label={t('ส่วนของชุดฝึก', 'Practice set sections')}>
        {[['practice', '#/arise', t('ฝึกทำโจทย์', 'Practice')], ['sheet', '#/arise/sheet', t('สรุปย่อ', 'Cheat sheet')], ['infographics', '#/arise/infographics', t('อินโฟกราฟิก', 'Infographics')], ['learn', '#/arise/learn', t('บทเรียนและคอร์ส', 'Lessons and courses')]].map(([key, href, label]) => (
          <a key={key} className="tab" href={href} aria-current={tab === key ? 'page' : undefined}>{label}</a>
        ))}
        {set.recommended && <a className="tab arise-recommended-tab" href="#/arise/recommended" aria-current={tab === 'recommended' || tab === 'recommended-practice' ? 'page' : undefined}>{t('แนะนำให้อ่าน', 'Recommended reading')}</a>}
      </nav>
      {set.recommended && tab !== 'recommended' && <RecommendedNotice recommendation={set.recommended} />}
      {tab === 'recommended' ? <RecommendedReadings set={set} />
        : tab === 'recommended-practice' ? <Drill key="recommended" set={set} results={results} setResults={setResults} recommendedOnly />
        : tab === 'learn' ? <Learning set={set} />
        : tab === 'sheet' ? <Sheet set={set} />
        : tab === 'infographics' ? <AriseInfographics set={set} decrypt={data.openMedia} />
        : <Drill key={topicId || 'all'} set={set} results={results} setResults={setResults} topicId={topicId} />}
    </div>
  );
}

function Unlock({ onUnlock }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | wrong | offline
  const submit = async (e) => {
    e.preventDefault();
    if (!code || state === 'busy') return;
    setState('busy');
    let envelope;
    try {
      const res = await fetch(ARISE_URL);
      if (!res.ok) throw new Error(res.status);
      envelope = await res.json();
    } catch {
      setState('offline');
      return;
    }
    try {
      const editions = await open(envelope, code);
      // The closure is kept only in App memory and is discarded on refresh.
      onUnlock({ ...editions, openMedia: (media) => open(media, code) });
    } catch {
      setState('wrong');
    }
  };
  return (
    <form className="card stack-14 narrow" onSubmit={submit}>
      <h1 className="h3">{t('ชุดฝึก Arise ต้องใช้รหัส', 'The Arise practice set needs a passphrase')}</h1>
      <p className="muted">{t('เนื้อหาชุดนี้ถูกเข้ารหัสไว้ กรอกรหัสเพื่อเปิดอ่าน รีเฟรชหน้าแล้วต้องกรอกใหม่', 'This set is encrypted. Enter the passphrase to open it. You will need it again after a refresh.')}</p>
      <label className="stack-6">
        <span className="label">{t('รหัส', 'Passphrase')}</span>
        <input className="input" type="password" autoComplete="off" value={code} onChange={(e) => { setCode(e.target.value); setState('idle'); }} aria-invalid={state === 'wrong'} />
      </label>
      <div aria-live="polite">
        {state === 'wrong' && <p className="error">{t('รหัสไม่ถูกต้อง', 'Wrong passphrase')}</p>}
        {state === 'offline' && <p className="error">{t('โหลดไฟล์ชุดฝึกไม่ได้ ลองใหม่อีกครั้ง', 'Could not load the practice set. Try again.')}</p>}
      </div>
      <button type="submit" className="btn btn-primary self-start" disabled={!code || state === 'busy'}>
        {state === 'busy' ? t('กำลังเปิด…', 'Opening…') : t('เปิดชุดฝึก', 'Open')}
      </button>
    </form>
  );
}

function RecommendedNotice({ recommendation }) {
  const { t } = useI18n();
  return <aside className="arise-recommended-notice stack-8" aria-label={t('แนะนำให้อ่าน', 'Recommended reading')}>
    <div className="row-8"><Badge kind="dark">{t('แนะนำให้อ่าน', 'Recommended reading')}</Badge><strong>{recommendation.title}</strong></div>
    <p className="small">{recommendation.intro}</p>
    <div className="row"><a className="btn btn-primary btn-sm" href="#/arise/recommended">{t('เปิดบทอ่านแนะนำ', 'Read the recommendations')}</a><a className="link" href="#/arise/recommended-practice">{t('ฝึกเฉพาะชุดนี้', 'Practice this set')} ({recommendation.questionIds.length})</a></div>
  </aside>;
}

function RecommendedReadings({ set }) {
  const { t } = useI18n();
  const r = set.recommended;
  if (!r) return <p>{t('ชุดนี้ยังไม่มีบทอ่านแนะนำ', 'This edition has no recommendations yet.')}</p>;
  return <div className="stack-24 narrow">
    <RecommendedNotice recommendation={r} />
    {r.items.map((item, i) => <article className="card stack-12" key={item.id}>
      <div className="row-8"><Badge kind="soft">{set.topics[item.topic]}</Badge><span className="small muted">{i + 1} / {r.items.length}</span></div>
      <h2 className="h3">{item.title}</h2><p>{item.body}</p><Code>{item.code}</Code>
      <div className="row">{item.refs.map((url) => <a className="link small" key={url} href={url} target="_blank" rel="noopener noreferrer">{t('เอกสารอ้างอิง', 'Source documentation')} ↗</a>)}</div>
    </article>)}
    <a className="btn btn-primary self-start" href="#/arise/recommended-practice">{t('ฝึกสถานการณ์จากบทอ่านนี้', 'Practice these scenarios')} ({r.questionIds.length})</a>
  </div>;
}

function Drill({ set, results, setResults, topicId, recommendedOnly = false }) {
  const { t } = useI18n();
  const start = set.topicIds.indexOf(topicId);
  const [filter, setFilter] = useState({ topic: start >= 0 ? String(start) : 'all', source: 'all', alignment: 'all' });
  const [order, setOrder] = useState(null); // shuffled question ids, null = original order
  const [index, setIndex] = useState(0);

  const pool = recommendedOnly ? set.questions.filter((q) => set.recommended?.questionIds.includes(q.id)) : set.questions;
  const ordered = order ? order.map((id) => pool.find((q) => q.id === id)) : pool;
  const list = filterQuestions(ordered, filter);
  const at = Math.min(index, Math.max(0, list.length - 1));
  const q = list[at];

  const answered = list.filter((x) => results[x.id]);
  const scored = answered.map((x) => grade(x, results[x.id])).filter((r) => r !== null);
  const right = scored.filter(Boolean).length;

  const change = (key) => (e) => { setFilter({ ...filter, [key]: e.target.value }); setIndex(0); };
  const move = (k) => { setIndex(k); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const reshuffle = () => {
    const ids = new Set(list.map((x) => x.id));
    setOrder([...shuffle([...ids]), ...ordered.filter((x) => !ids.has(x.id)).map((x) => x.id)]);
    setResults({});
    setIndex(0);
  };

  return (
    <div className="stack-20">
      <div className="arise-toolbar">
        <label className="stack-4">
          <span className="label">{t('หัวข้อ', 'Topic')}</span>
          <select className="input" value={filter.topic} onChange={change('topic')}>
            <option value="all">{t('ทุกหัวข้อ', 'All topics')}</option>
            {set.topics.map((name, i) => <option key={i} value={String(i)}>{name}</option>)}
          </select>
        </label>
        <label className="stack-4">
          <span className="label">{t('แหล่งที่มา', 'Source')}</span>
          <select className="input" value={filter.source} onChange={change('source')}>
            <option value="all">{t('ทุกแหล่งที่มา', 'All sources')}</option>
            <option value="sheet">{t('โจทย์จากชีทเรียน', 'From training sheets')}</option>
            <option value="docs">{t('คอร์สเพิ่มเติม · เอกสารต้นทาง', 'Extra courses · vendor docs')}</option>
          </select>
        </label>
        <label className="stack-4">
          <span className="label">{t('ขอบเขตเนื้อหา', 'Scope')}</span>
          <select className="input" value={filter.alignment} onChange={change('alignment')}>
            <option value="all">{t('ทุกขอบเขต', 'All scopes')}</option>
            <option value="direct">{t('ตรงกับหัวข้อสอบ', 'Matches exam topics')}</option>
            <option value="related">{t('เนื้อหาเสริม', 'Supplementary')}</option>
          </select>
        </label>
        <label className="stack-4">
          <span className="label">{t('ไปยังข้อ', 'Go to question')}</span>
          <select className="input" value={at} disabled={!list.length} onChange={(e) => move(Number(e.target.value))}>
            {list.map((x, k) => <option key={x.id} value={k}>{k + 1} / {list.length}{results[x.id] ? ' ·' : ''}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-secondary" disabled={!list.length} onClick={reshuffle} title={t('สลับลำดับข้อในชุดที่เลือก และล้างคำตอบทั้งหมด', 'Shuffle the filtered questions and clear all answers')}>{t('สุ่มข้อ', 'Shuffle')}</button>
      </div>

      <div className="row-24 muted small" aria-live="polite">
        <span><b>{list.length}</b> {t('ข้อในชุด', 'in this set')}</span>
        <span><b>{answered.length}</b> {t('ตอบแล้ว', 'answered')}</span>
        <span><b>{right}/{scored.length}</b> {t('ถูก', 'correct')}</span>
        {Object.keys(results).length > 0 && <button type="button" className="link push" onClick={() => setResults({})}>{t('ล้างคำตอบทั้งหมด', 'Clear all answers')}</button>}
      </div>
      <Progress value={list.length ? Math.round((answered.length / list.length) * 100) : 0} />

      {q ? (
        <Question
          key={q.id}
          q={q}
          set={set}
          picked={results[q.id]}
          onSubmit={(selected) => setResults({ ...results, [q.id]: selected })}
          onRetry={() => { const next = { ...results }; delete next[q.id]; setResults(next); }}
        />
      ) : (
        <div className="card stack-6">
          <h2 className="h3">{t('ไม่มีข้อในตัวกรองนี้', 'No questions match these filters')}</h2>
          <p className="muted">{t('ลองเปลี่ยนหัวข้อหรือแหล่งที่มา', 'Try another topic or source.')}</p>
        </div>
      )}

      <div className="row-between">
        <button type="button" className="btn btn-secondary" disabled={at === 0 || !list.length} onClick={() => move(at - 1)}>{t('ข้อก่อนหน้า', 'Previous')}</button>
        <button type="button" className="btn btn-dark" disabled={at >= list.length - 1} onClick={() => move(at + 1)}>{t('ข้อถัดไป', 'Next')}</button>
      </div>
    </div>
  );
}

function Question({ q, set, picked, onSubmit, onRetry }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => picked || (q.type === 'order' ? q.choices.map((_, i) => i) : []));
  const done = Boolean(picked);
  const result = done ? grade(q, picked) : null;
  const typeLabel = { single: t('เลือก 1 คำตอบ', 'Choose one answer'), multi: t('เลือกทุกข้อที่ถูก', 'Choose every correct answer'), order: t('เรียงลำดับขั้นตอน', 'Put the steps in order') }[q.type];
  const originLabel = q.origin === 'sheet' ? t('ข้อฝึกจากชีท', 'From a training sheet') : q.origin === 'docs' ? t('ข้อฝึกแต่งเพิ่ม · เอกสารต้นทาง', 'Extra practice · vendor docs') : t('ข้อฝึกทบทวน', 'Review practice');

  const toggle = (i) => setDraft(q.type === 'single' ? [i] : draft.includes(i) ? draft.filter((x) => x !== i) : [...draft, i]);
  const swap = (k, dir) => { const next = draft.slice(); [next[k], next[k + dir]] = [next[k + dir], next[k]]; setDraft(next); };

  return (
    <article className="stack-18">
      <div className="row-8">
        {q.topics.map((ti) => <Badge key={ti} kind="soft">{set.topics[ti]}</Badge>)}
      </div>
      <h2 className="question">{q.stem}</h2>
      <div className="row-8">
        <Badge kind="dark">{typeLabel}</Badge>
        <Badge kind="temp">{originLabel}</Badge>
        {q.recommended && <Badge kind="dark">{t('แนะนำให้ฝึก', 'Recommended practice')}</Badge>}
        {q.scored === false && <Badge kind="bad">{t('ไม่คิดคะแนน', 'Not scored')}</Badge>}
      </div>

      {q.type === 'order' ? (
        <ol className="arise-order">
          {draft.map((ci, k) => (
            <li key={ci} className="option">
              <span className="mono muted">{k + 1}</span>
              <span className="grow"><span className="mono muted">{LETTERS[ci]}.</span> {q.choices[ci]}</span>
              <span className="row-8">
                <button type="button" className="btn btn-secondary btn-sm" disabled={done || k === 0} onClick={() => swap(k, -1)} aria-label={t('เลื่อน ', 'Move ') + LETTERS[ci] + t(' ขึ้น', ' up')}>↑</button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={done || k === draft.length - 1} onClick={() => swap(k, 1)} aria-label={t('เลื่อน ', 'Move ') + LETTERS[ci] + t(' ลง', ' down')}>↓</button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <fieldset className="options">
          <legend className="sr-only">{typeLabel}</legend>
          {q.choices.map((text, i) => {
            let state = draft.includes(i) ? 'selected' : '';
            if (done && result !== null && q.answer.includes(i)) state = 'correct';
            else if (done && result !== null && picked.includes(i)) state = 'wrong';
            return (
              <label key={i} className={'option ' + state}>
                <input type={q.type === 'single' ? 'radio' : 'checkbox'} name={'arise-' + q.id} checked={draft.includes(i)} disabled={done} onChange={() => toggle(i)} />
                <span className="mono muted">{LETTERS[i]}</span>
                <span className="grow">{text}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="row end">
        {done
          ? <button type="button" className="btn btn-secondary" onClick={onRetry}>{t('ลองข้อนี้ใหม่', 'Try this question again')}</button>
          : <button type="button" className="btn btn-primary" disabled={!draft.length} onClick={() => onSubmit(draft)}>{t('ตรวจคำตอบ', 'Check answer')}</button>}
      </div>

      <div aria-live="polite">{done && <Feedback q={q} set={set} picked={picked} result={result} />}</div>
    </article>
  );
}

function Feedback({ q, set, picked, result }) {
  const { t } = useI18n();
  const course = set.courses.find((c) => c.slug === q.course);
  const refTitle = (url) => set.references.find((r) => r.url === url)?.title || url;
  const tone = result === null ? '' : result ? 'feedback-ok' : 'feedback-bad';
  return (
    <div className={'feedback stack-12 ' + tone}>
      <div className="feedback-title">
        {result === null ? t('ทบทวนเหตุผล · ไม่คิดคะแนน', 'Review the reasoning · not scored') : result ? t('ถูกต้อง', 'Correct') : t('ยังไม่ถูก', 'Not quite')}
      </div>
      <p>{t('คำตอบที่ถูก: ', 'Correct answer: ')}<b>{answerLabel(q)}</b>
        {q.type !== 'order' ? null : <span className="muted"> · {t('ที่คุณเรียง: ', 'Your order: ')}{picked.map((i) => LETTERS[i]).join(' → ')}</span>}
      </p>
      {q.note && <p>{q.note}</p>}
      <div className="stack-10">
        <h3 className="label">{t('เหตุผลของแต่ละตัวเลือก', 'Why each choice is right or wrong')}</h3>
        {q.choices.map((text, i) => (
          <div key={i} className="explain stack-4">
            <b>{LETTERS[i]}. {text}</b>
            <span>
              {q.type === 'order' ? t('เหตุผลของขั้นตอน · ', 'About this step · ') : q.answer.includes(i) ? t('ถูก · ', 'Correct · ') : t('ไม่ตรงโจทย์ · ', 'Does not fit · ')}
              {q.reasons[i]}
            </span>
          </div>
        ))}
      </div>
      <details>
        <summary>{t('ที่มาและคลิปที่เกี่ยวข้อง', 'Source and related course')}</summary>
        <div className="stack-6 small">
          {course
            ? <p>{t('คลิปที่เกี่ยวข้อง: ', 'Related course: ')}<a className="link" href={course.url} target="_blank" rel="noopener noreferrer">{course.title} ↗</a></p>
            : <p className="muted">{t('ที่มา: ข้อฝึกเสริมจากเอกสารทางเทคนิค', 'Source: extra practice based on technical documentation')}</p>}
          {q.sheet && <p>{t('ชีท: ', 'Sheet: ')}{q.sheet.file}{q.sheet.pages?.length ? t(' หน้า ', ' page ') + q.sheet.pages.join(', ') : ''}</p>}
          {q.checkedAt && <p className="muted">{t('ตรวจคำอธิบายเมื่อ ', 'Explanation checked on ')}{q.checkedAt}</p>}
        </div>
      </details>
      {q.refs?.length > 0 && (
        <details>
          <summary>{t('เอกสารต้นทางที่ใช้ตรวจคำอธิบาย', 'Sources used to check the explanation')}</summary>
          <div className="stack-6 small">
            {q.refs.map((url) => <a key={url} className="link" href={url} target="_blank" rel="noopener noreferrer">{refTitle(url)} ↗</a>)}
          </div>
        </details>
      )}
      <p className="small muted">{t('คำอธิบายสำหรับทบทวน ไม่ใช่เฉลยทางการจากผู้จัดสอบ', 'Explanations are for review, not an official answer key from the exam organizer.')}</p>
    </div>
  );
}

// Chapter principles (authored from the set's answers and reasons) plus an
// answer key built straight from the questions, so it can't drift from them.
// Each chapter: an opening scene, grouped key → rule → trap items, a mnemonic.
// Self-test mode hides rules until revealed; printing always shows everything.
function Sheet({ set }) {
  const { t } = useI18n();
  const [chapter, setChapter] = useState('all');
  const [showKeys, setShowKeys] = useState(false);
  const [selfTest, setSelfTest] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const chapters = set.topics.map((title, i) => i).filter((i) => chapter === 'all' || String(i) === chapter);
  const reveal = (id) => setRevealed(new Set(revealed).add(id));
  const correct = (q) => q.answer.map((i) => q.choices[i]).join(q.type === 'order' ? ' → ' : ' + ');
  return (
    <div className="stack-24">
      <div className="arise-toolbar no-print">
        <label className="stack-4">
          <span className="label">{t('บท', 'Chapter')}</span>
          <select className="input" value={chapter} onChange={(e) => setChapter(e.target.value)}>
            <option value="all">{t('ทุกบท', 'All chapters')}</option>
            {set.topics.map((name, i) => <option key={i} value={String(i)}>{i + 1}. {name}</option>)}
          </select>
        </label>
        <label className="option arise-check">
          <input type="checkbox" checked={selfTest} onChange={(e) => { setSelfTest(e.target.checked); setRevealed(new Set()); }} />
          <span className="grow">{t('ทดสอบตัวเอง (ซ่อนคำอธิบาย)', 'Self-test (hide explanations)')}</span>
        </label>
        <label className="option arise-check">
          <input type="checkbox" checked={showKeys} onChange={(e) => setShowKeys(e.target.checked)} />
          <span className="grow">{t('แสดงเฉลยย่อรายข้อ', 'Show the answer key')}</span>
        </label>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>{t('พิมพ์ / บันทึก PDF', 'Print / save as PDF')}</button>
      </div>
      <p className="muted small">{t(
        'สรุปจากเฉลย เหตุผล และหมายเหตุของโจทย์ในแต่ละบท ข้อหนึ่งอาจอยู่ได้หลายบท',
        'Summarized from the answers, reasons and notes in each chapter. A question can belong to more than one chapter.',
      )}</p>
      {chapters.map((i) => {
        const qs = set.questions.filter((q) => q.topics.includes(i));
        const c = set.cheatsheet?.[i];
        return (
          <section key={i} className="stack-16 arise-sheet">
            <div className="tier-head">
              <h2 className="h2">{i + 1}. {set.topics[i]}</h2>
              {set.recommended?.items.some((item) => item.topic === i) && <Badge kind="dark">{t('แนะนำให้อ่าน', 'Recommended reading')}</Badge>}
              <span className="muted">{t(`${qs.length} ข้อ`, `${qs.length} questions`)}</span>
            </div>
            {c && <p className="arise-story">{c.story}</p>}
            {c && <AriseConceptMap key={i} title={set.topics[i]} chapter={c} chapterIndex={i} selfTest={selfTest} revealed={revealed} onReveal={reveal} />}
            {c?.groups.map((g, gi) => (
              <div key={gi} className="stack-8">
                <h3 className="h3">{g.title}</h3>
                <ul className="arise-items">
                  {g.items.map((it, k) => {
                    const id = `${i}.${gi}.${k}`;
                    const hidden = selfTest && !revealed.has(id);
                    return (
                      <li key={k} className={'arise-item' + (hidden ? ' concealed' : '')}>
                        <b className="arise-term">{it.key}</b>
                        {hidden && <button type="button" className="link self-start no-print" onClick={() => reveal(id)}>{t('นึกให้ได้ก่อน แล้วกดดู', 'Recall it first, then reveal')}</button>}
                        <div className="arise-reveal stack-6">
                          <span>{it.rule}</span>
                          {it.trap && <span className="arise-trap"><b>{t('กับดัก: ', 'Trap: ')}</b>{it.trap}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {c?.mnemonic && <p className="arise-mnemonic"><span>{t('จำสั้น ๆ', 'In short')}</span>{c.mnemonic}</p>}
            {showKeys && (
              <div className="stack-8">
                <h3 className="label">{t('เฉลยย่อ', 'Answer key')}</h3>
                <ol className="card arise-key">
                  {qs.map((q) => <li key={q.id}><span>{q.stem}</span><b>{correct(q)}</b></li>)}
                </ol>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Learning({ set }) {
  const { t } = useI18n();
  return (
    <div className="stack-24">
      <section className="card stack-8">
        <b>{set.intro.updated}</b>
        {set.intro.notice.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <section className="stack-14">
        <h2 className="h3">{t(`อ่านเป็นบทตาม ${set.topics.length} หัวข้อ`, `Study by chapter across ${set.topics.length} topics`)}</h2>
        <p className="muted">{set.intro.readingOrder}</p>
        <div className="grid-cards">
          {set.topics.map((title, i) => {
            const l = set.learning[i];
            const count = set.questions.filter((q) => q.topics.includes(i)).length;
            return (
              <article key={i} className="card stack-10">
                <div className="row-8">
                  <Badge>{t('บท ', 'Ch. ')}{i + 1}</Badge>
                  <Badge kind="soft">Sphere: {l.coverage}</Badge>
                  {set.recommended?.items.some((item) => item.topic === i) && <Badge kind="dark">{t('แนะนำให้อ่าน', 'Recommended reading')}</Badge>}
                </div>
                <h3 className="card-title">{title}</h3>
                <ul className="stack-4">{l.read.map((x, k) => <li key={k}>{x}</li>)}</ul>
                <p className="small">{l.note}</p>
                <p className="small muted">{t(`ข้อฝึกที่เกี่ยวข้อง ${count} ข้อ`, `${count} related questions`)}</p>
                {l.courses.map((c) => <a key={c} className="link small" href={set.courses[c].url} target="_blank" rel="noopener noreferrer">{set.courses[c].title} ↗</a>)}
                <div className="row-8">
                  <a className="btn btn-primary btn-sm" href={'#/arise/topic/' + set.topicIds[i]}>{t('ฝึกบทนี้', 'Practice this chapter')}</a>
                  <a className="btn btn-secondary btn-sm" href={'#/topic/' + set.topicIds[i]}>{t('อ่านหัวข้อนี้ใน Dev Trail', 'Read this topic in Dev Trail')}</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="stack-14">
        <h2 className="h3">{t('คอร์สและไฟล์ประกอบที่ตรวจพบ', 'Courses and attached files')}</h2>
        <p className="muted">{set.intro.coursesNote}</p>
        <div className="grid-cards">
          {set.courses.map((c) => (
            <article key={c.slug} className="card stack-8">
              <div className="row-8">
                <Badge kind="soft">{c.cohort || (c.slug.startsWith('dt-') ? 'DevTrail' : 'Alpha Makeathon')}</Badge>
                <Badge kind="temp">{c.minutes} {t('นาที', 'min')}</Badge>
              </div>
              <h3 className="card-title"><a className="link" href={c.url} target="_blank" rel="noopener noreferrer">{c.title} ↗</a></h3>
              <p>{c.summary}</p>
              {c.topicNotes && (
                <ul className="stack-4 small">
                  {Object.entries(c.topicNotes).map(([ti, note]) => <li key={ti}><b>{set.topics[ti]}:</b> {note}</li>)}
                </ul>
              )}
              {c.sheets.length > 0 ? (
                <details>
                  <summary>{t(`ชีท PDF ${c.sheets.length} ไฟล์`, `${c.sheets.length} PDF sheets`)}</summary>
                  <ul className="stack-4 small">
                    {c.sheets.map((s) => <li key={s}>{s}{set.localSheets.includes(s) ? t(' · เคยบันทึกไว้ในเครื่อง', ' · previously saved locally') : t(' · ดูใน Sphere', ' · on Sphere')}</li>)}
                  </ul>
                  <p className="small muted">{t('เปิดคอร์ส → Enter Classroom → Attachments', 'Open the course → Enter Classroom → Attachments')}</p>
                </details>
              ) : (
                <p className="small muted">{c.attachmentsChecked ? t('ตรวจห้องเรียนแล้ว ยังไม่พบ Attachments', 'Classroom checked, no Attachments found') : t('ยังไม่พบ Attachments ในบทที่ตรวจ', 'No Attachments found in the lessons checked')}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <details className="card">
        <summary>{t(`แหล่งเสริมทางการที่ใช้ตรวจคำอธิบาย (${set.references.length})`, `Official sources used to check explanations (${set.references.length})`)}</summary>
        <div className="stack-6 small">
          {set.references.map((r) => <a key={r.url} className="link" href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗</a>)}
        </div>
      </details>
    </div>
  );
}
