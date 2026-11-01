import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { mediaBlob, mediaUrl } from '../lib/arise-media.js';

function useMedia(id, decrypt, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ id: null, status: 'idle' });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let disposed = false;
    let url;
    setState({ id, status: 'loading' });
    (async () => {
      const response = await fetch(mediaUrl(id), { signal: controller.signal });
      if (!response.ok) throw new Error('Media unavailable');
      const media = await decrypt(await response.json());
      if (disposed) return;
      url = URL.createObjectURL(mediaBlob(media, id));
      setState({ id, status: 'ready', url });
    })().catch(() => {
      if (!disposed) setState({ id, status: 'error' });
    });
    return () => {
      disposed = true;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, decrypt, enabled, attempt]);
  // Never show the previous chapter while the next effect is starting.
  const current = state.id === id ? state : { id, status: enabled ? 'loading' : 'idle' };
  return [current, () => setAttempt((n) => n + 1)];
}

export default function AriseInfographics({ set, decrypt }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [wantBook, setWantBook] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  const id = set.topicIds[index];
  const [image, retry] = useMedia(id, decrypt);
  const [book, retryBook] = useMedia('book', decrypt, wantBook);
  const title = set.topics[index];
  return (
    <section className="stack-20" aria-labelledby="arise-infographics-title">
      <div className="stack-6">
        <h2 className="h2" id="arise-infographics-title">{t('อินโฟกราฟิกสรุป 14 บท', '14 chapter infographics')}</h2>
        <p className="muted">{t('ภาพภาษาไทย สัดส่วน A4 สำหรับทบทวนประเด็นสำคัญ อ่านรายละเอียดและเงื่อนไขทั้งหมดต่อในสรุปย่อ', 'Thai-language A4 overview images for reviewing key ideas. See the cheat sheet for full details and conditions.')}</p>
      </div>
      <div className="arise-media-toolbar no-print">
        <label className="stack-4 grow"><span className="label">{t('เลือกบท', 'Choose a chapter')}</span>
          <select className="input" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
            {set.topics.map((name, i) => <option key={set.topicIds[i]} value={i}>{i + 1}. {name}</option>)}
          </select>
        </label>
        <div className="row-8">
          <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => setIndex((n) => n - 1)}>{t('บทก่อนหน้า', 'Previous')}</button>
          <button type="button" className="btn btn-secondary" disabled={index === set.topics.length - 1} onClick={() => setIndex((n) => n + 1)}>{t('บทถัดไป', 'Next')}</button>
        </div>
      </div>
      <figure className="arise-poster">
        <figcaption className="arise-poster-caption">
          <strong>{index + 1} / {set.topics.length} · {title}</strong>
          {image.status === 'ready' && <div className="row-8 no-print">
            <a className="link" href={image.url} target="_blank" rel="noopener noreferrer">{t('เปิดภาพขนาดเต็ม', 'Open full-size image')} ↗</a>
            <a className="link" href={image.url} download={'arise-' + id + '-a4.png'}>{t('ดาวน์โหลด PNG', 'Download PNG')}</a>
          </div>}
        </figcaption>
        <div className="arise-poster-page" aria-busy={image.status === 'loading'}>
          {image.status === 'ready' && image.url !== failedImage ? <img key={image.url} src={image.url} alt={t('อินโฟกราฟิกสรุป ', 'Summary infographic: ') + title} onError={() => setFailedImage(image.url)} />
            : <div className="arise-poster-placeholder" role="status">
              {image.status === 'error' || image.url === failedImage ? <><p>{t('โหลดภาพไม่ได้ ลองใหม่อีกครั้ง', 'Could not load the image. Please try again.')}</p><button type="button" className="btn btn-secondary" onClick={retry}>{t('ลองใหม่', 'Retry')}</button></>
                : <p>{t('กำลังโหลดและเปิดภาพ…', 'Loading and decrypting the image…')}</p>}
            </div>}
        </div>
      </figure>
      <div className="card stack-12 no-print">
        <h3 className="h3">{t('อ่านต่อเนื่องหรือพิมพ์ A4', 'Read or print the A4 collection')}</h3>
        <p className="muted small">{t('PDF รวม 14 หน้า ประมาณ 32 MB · โหลดเมื่อกดเตรียมไฟล์เท่านั้น', '14-page PDF, about 32 MB · Loaded only when you request it.')}</p>
        <div className="row">
          {!wantBook && <button type="button" className="btn btn-primary" onClick={() => setWantBook(true)}>{t('เตรียม PDF ทั้งชุด', 'Prepare the full PDF')}</button>}
          {wantBook && book.status === 'loading' && <p role="status">{t('กำลังโหลดและเปิด PDF…', 'Loading and decrypting the PDF…')}</p>}
          {wantBook && book.status === 'error' && <><p role="status">{t('โหลด PDF ไม่สำเร็จ', 'Could not load the PDF.')}</p><button type="button" className="btn btn-secondary" onClick={retryBook}>{t('ลองใหม่', 'Retry')}</button></>}
          {book.status === 'ready' && <a className="btn btn-primary" href={book.url} download="Arise-14-chapters-A4.pdf">{t('ดาวน์โหลด PDF 14 หน้า', 'Download the 14-page PDF')}</a>}
          <a className="link" href="#/arise/sheet">{t('อ่านสรุปย่อแบบข้อความ', 'Read the text cheat sheet')}</a>
        </div>
      </div>
    </section>
  );
}
