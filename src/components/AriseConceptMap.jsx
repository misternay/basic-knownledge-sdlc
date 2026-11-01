import { useId, useState } from 'react';
import { useI18n } from '../i18n.jsx';

// Only renders the unlocked edition passed by ArisePage. No private copy lives
// in the bundle. Branches express chapter membership, not a causal sequence.
export default function AriseConceptMap({ title, chapter, chapterIndex, selfTest, revealed, onReveal }) {
  const { t } = useI18n();
  const headingId = useId();
  const [groupIndex, setGroupIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  if (!chapter?.groups?.length) return null;
  const group = chapter.groups[groupIndex] || chapter.groups[0];
  const item = group.items[itemIndex] || group.items[0];
  const revealId = `${chapterIndex}.${groupIndex}.${itemIndex}`;
  const hidden = selfTest && !revealed.has(revealId);
  return (
    <section className="arise-map" aria-labelledby={headingId}>
      <div className="arise-map-heading">
        <h3 className="h3" id={headingId}>{t('แผนภาพภาพรวม', 'Concept map')}</h3>
        <p className="small muted">{t('เลือกกลุ่ม แล้วเลือกคำสำคัญเพื่อเชื่อมภาพรวมกับรายละเอียด', 'Choose a branch, then a concept to connect the overview with the details.')}</p>
      </div>
      <div className="arise-map-tree">
        <div className="arise-map-root">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <path d="M12 22h10m0 0V9h10M22 22h10M22 22v13h10" stroke="currentColor" strokeWidth="2" />
            <circle cx="9" cy="22" r="4" fill="currentColor" /><circle cx="35" cy="9" r="3" fill="currentColor" /><circle cx="35" cy="22" r="3" fill="currentColor" /><circle cx="35" cy="35" r="3" fill="currentColor" />
          </svg>
          <strong>{title}</strong>
          <span className="small">{t(`${chapter.groups.length} กลุ่มแนวคิด`, `${chapter.groups.length} concept groups`)}</span>
        </div>
        <ul className="arise-map-branches" aria-label={t('กลุ่มแนวคิดในบท', 'Chapter concept groups')}>
          {chapter.groups.map((g, gi) => (
            <li key={gi}>
              <button type="button" className="arise-map-branch" aria-pressed={gi === groupIndex}
                onClick={() => { setGroupIndex(gi); setItemIndex(0); }}>
                <span className="arise-map-number" aria-hidden="true">{String(gi + 1).padStart(2, '0')}</span>
                <span><strong>{g.title}</strong><span className="small muted">{t(`${g.items.length} คำสำคัญ`, `${g.items.length} concepts`)}</span></span>
                <span aria-hidden="true">↘</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="arise-map-explore">
        <h4>{group.title}</h4>
        <div className="arise-map-terms" role="group" aria-label={t('เลือกคำสำคัญ', 'Choose a concept')}>
          {group.items.map((it, k) => (
            <button type="button" key={k} aria-pressed={k === itemIndex} onClick={() => setItemIndex(k)}>{it.key}</button>
          ))}
        </div>
        <div className="arise-map-detail" aria-live="polite" aria-atomic="true">
          <strong className="arise-map-selected">{item.key}</strong>
          {hidden ? <button type="button" className="btn btn-secondary self-start no-print" onClick={() => onReveal(revealId)}>{t('นึกหลักการและกับดักก่อน แล้วกดดู', 'Recall the rule and trap, then reveal')}</button> : (
            <dl className="arise-map-rule">
              <div><dt>{t('หลักการ', 'Rule')}</dt><dd>{item.rule}</dd></div>
              {item.trap && <div className="arise-map-trap"><dt>{t('ระวัง', 'Watch out')}</dt><dd>{item.trap}</dd></div>}
            </dl>
          )}
        </div>
      </div>
      <p className="small muted arise-map-caption">{t('เส้นเชื่อมแสดงการจัดกลุ่มในบทนี้ · อ่านรายละเอียดครบทุกเรื่องได้ด้านล่าง', 'Connections show how this chapter is grouped · Read all concepts in full below.')}</p>
    </section>
  );
}
