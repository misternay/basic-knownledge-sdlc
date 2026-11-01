# Dev Trail

เว็บทบทวนความรู้สำหรับนักพัฒนา 17 หัวข้อ ใช้เรียนเองคนเดียว เน้นทำความเข้าใจ ไม่เน้นความคืบหน้า
React 19 + Vite 8 (JSX ไม่มี TypeScript) เป็น static site บน GitHub Pages

## หลักที่ตั้งใจไว้ (อย่าเพิ่มโดยไม่ถามก่อน)
- ไม่มี login ไม่มี backend ไม่มีฐานข้อมูล
- ไม่เก็บคะแนน ประวัติ หรือความคืบหน้า (รีเฟรชแล้วเริ่มใหม่ ไม่ใช้ localStorage)
- เนื้อหาทั้งหมดเป็นไฟล์ใน `content/topics/` และถูก bundle ตอน build
- ใช้ hash route (`#/topic/sql`) และ `base: './'` เพื่อให้ทำงานบน GitHub Pages โดยไม่ต้องตั้ง rewrite
- UI เป็นภาษาไทย
- ข้อยกเว้นที่ผู้ใช้ขอ: ชุดฝึก Arise (`#/arise`) ล็อกด้วยรหัสผ่าน ดูหัวข้อ "ชุดฝึก Arise" ด้านล่าง

## คำสั่ง
```bash
npm ci
npm run dev            # http://localhost:5173
npm run check:content  # ตรวจเนื้อหาแบบ strict
npm test               # node --test tests/*.test.mjs
npm run build          # check:content แล้ว vite build -> dist/
```
ต้องใช้ Node 20.19+ หรือ 22.12+ (CI ใช้ 24)

## โครงสร้าง
- `content/topics/<id>.json` เนื้อหาที่เว็บใช้จริง (วาง `.md` ได้ด้วย) ชื่อไฟล์ต้องตรงกับ `id`
- `content/AUTHORING.md` กติกาการเขียนเนื้อหา อ่านก่อนแก้เนื้อหาทุกครั้ง
- `content/tracks.json`, `content/exams.json` เส้นทาง 4 สาย และชนิดบททดสอบ
- `src/lib/validate.js` ตัวตรวจเนื้อหา ใช้ร่วมกันทั้งหน้า "นำเข้า" และ `scripts/check-content.mjs`
- `src/lib/markdown.js` แปลง Markdown เป็น topic, `src/lib/checks.js` ตรวจคำตอบแบบฝึกหัด
- `src/components/` หน้า Home, TopicPage, QuestionRunner, Exercise, Practice, Exams, ImportPage, ArisePage
- `.github/workflows/deploy.yml` ตรวจเนื้อหา, test, build แล้ว deploy Pages เมื่อ push ขึ้น `main` (PR ตรวจแต่ไม่ deploy)

## กติกาเนื้อหา (สรุปจาก AUTHORING.md)
- ภาษาไทย ไม่ใช้ emoji ข้อเท็จจริงต้องถูกต้อง ณ ปัจจุบัน ไม่แต่งเวอร์ชันหรือชื่อ package
- ต่อหัวข้อ: mustKnow 24 เรื่อง (must 10–12, should 7–8, advanced 4–5) เรื่องที่เพิ่มใหม่ต้องมี `ref` เป็นแหล่งหลักที่เปิดตรวจแล้ว (12 เรื่องเดิมของแต่ละหัวข้อยังไม่มี `ref` รายเรื่อง ทยอยเติมได้), คำถามสถานการณ์ 30 ข้อมีคำอธิบายทุกข้อ, แบบฝึกหัด 3 ข้อ (`exercises[]` ง่าย/กลาง/ยาก), `refs[]` 4–8 รายการ
- `exam: true` ใช้กับหัวข้อมาตรฐานที่พบบ่อยในข้อสอบ/สัมภาษณ์สายนักพัฒนา ห้ามอ้างว่าเคยออกข้อสอบของที่ใดที่หนึ่งโดยไม่มีที่มา
- regex ของแบบฝึกหัดเทียบกับคำตอบตัวพิมพ์เล็กที่ตัดคอมเมนต์แล้ว (flag `im`) เฉลยต้องผ่านทุกเกณฑ์ starter ต้องไม่ผ่านทั้งหมด
- แก้เนื้อหาแล้วต้องรัน `npm run check:content` และ `npm test` ให้ผ่านก่อน commit

## ชุดฝึก Arise
- โจทย์ 168 ข้อจากชุดฝึกรุ่นก่อน (single/multi/order มีเหตุผลทุกตัวเลือก) พร้อมคอร์ส บทเรียน และอ้างอิง ห้ามตัดข้อหรือข้อมูลออก
- มีส่วนเสริม AI แนะนำให้อ่าน 6 เรื่องและข้อฝึก 8 ข้อ รวม 176 ข้อ เก็บใน `recommended` และ `questions` ของต้นฉบับทั้งสองภาษา ห้ามตัดกลับเหลือ 168 เมนู `#/arise/recommended` และ `#/arise/recommended-practice` แสดงและฝึกชุดนี้ โดยระบุว่าเป็นข้อแต่งเพิ่ม
- `node scripts/encrypt-arise.mjs` ถามรหัสเดิมแบบซ่อน (หรือรับ `ARISE_PASSCODE`) และตรวจว่าเปิดไฟล์เดิมได้ก่อนเขียน เพื่อไม่เปลี่ยนรหัสจนเปิดภาพและ PDF เดิมไม่ได้
- ต้นฉบับ `private/arise/th.json`, `en.json` อยู่นอก git (`.gitignore`) ห้าม commit เพราะ repo เป็น public ถ้าโฟลเดอร์นี้ไม่มีในเครื่อง แก้เนื้อหาชุดนี้ไม่ได้ (มีแต่ไฟล์เข้ารหัส)
- ขึ้นเว็บเฉพาะ `public/arise.enc.json` (AES-GCM + PBKDF2, `src/lib/vault.js`) แก้ต้นฉบับแล้วเข้ารหัสใหม่: `ARISE_PASSCODE='...' node scripts/encrypt-arise.mjs` แล้ว commit ไฟล์ `.enc.json` ห้ามใส่รหัสลงไฟล์ใน repo
- ถอดรหัสในเบราว์เซอร์ เก็บในหน่วยความจำเท่านั้น รีเฟรชต้องกรอกใหม่ ไม่ผ่าน `validate.js` (กติกา 24/30/3 ไม่ใช้กับชุดนี้) ตรวจด้วย `checkEdition`/`checkParity` ใน `src/lib/arise.js` (ฉบับ en ต้องมี id, เฉลย และโครงสร้าง cheatsheet ตรงกับ th)
- หน้า `#/arise` มี 4 แท็บ: ฝึกทำโจทย์, สรุปย่อ (`#/arise/sheet`), อินโฟกราฟิก (`#/arise/infographics`), บทเรียนและคอร์ส (`#/arise/learn`) หน้าหัวข้อ 14 หัวข้อมีปุ่มไป `#/arise/topic/<id>` (`ARISE_TOPIC_IDS`)
- ภาพภาษาไทย 14 บทกับ PDF อยู่ใน `private/arise/infographics/` เผยแพร่เฉพาะ `public/arise-media/*.enc.json` ที่เข้ารหัสด้วยรหัสเดิม สร้างด้วย `node scripts/encrypt-arise-media.mjs` ซึ่งถามรหัสแบบซ่อนหรือรับ `ARISE_PASSCODE` และตรวจรหัสกับ `public/arise.enc.json` ก่อนเขียนไฟล์ ห้ามเผยแพร่ PNG/PDF ต้นฉบับ หน้าเว็บโหลดทีละภาพและโหลด PDF เมื่อขอเท่านั้น Blob URL และตัวถอดรหัสเก็บในหน่วยความจำ ไม่ใช้ storage
- `cheatsheet` ต่อบท = `{story, groups: [{title, items: [{key, rule, trap?}]}], mnemonic}` ทุกข้อต้องมีที่มาจากเฉลย/เหตุผล/หมายเหตุของโจทย์ในบทนั้น คงคำอย่าง "อาจ" "โดยทั่วไป" และเงื่อนไขไว้ ห้ามเอาตัวเลือกผิดมาเป็นกฎ `story` เป็นฉากสมมติ ห้ามมีข้อเท็จจริงทางเทคนิคเพิ่ม เฉลยย่อรายข้อสร้างจากโจทย์ตอนแสดงผล ไม่ได้เก็บแยก
- แบบร่างและไฟล์แก้อยู่ใน `private/arise/batches/` รวมเข้าต้นฉบับด้วย `python3 -I private/arise/merge-cheatsheet.py`

## ในโฟลเดอร์นี้แต่ไม่ใช่ส่วนของโปรเจกต์
`exam-prep-30-days/` เป็นงานอีกชิ้น ถูกกันไว้ใน `.git/info/exclude` ห้ามแก้และห้าม commit
