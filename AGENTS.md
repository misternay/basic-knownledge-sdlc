# AGENTS.md

กติกาสำหรับ agent ที่ทำงานใน repo นี้ (Codex, Antigravity/agy และเครื่องมืออื่นที่อ่าน AGENTS.md)
รายละเอียดเต็มอยู่ใน `CLAUDE.md` ถ้าสองไฟล์ขัดกัน ให้ยึด `CLAUDE.md` และแก้ทั้งสองไฟล์ให้ตรงกัน

## โปรเจกต์
Dev Trail เว็บทบทวนความรู้สำหรับนักพัฒนา 17 หัวข้อ ใช้เรียนเองคนเดียว เน้นทำความเข้าใจ
React 19 + Vite 8 (JSX ไม่มี TypeScript) เป็น static site บน GitHub Pages UI เป็นภาษาไทย มีฉบับภาษาอังกฤษคู่กัน

## ห้ามเพิ่มโดยไม่ถามเจ้าของก่อน
- login, backend, ฐานข้อมูล
- การเก็บคะแนน ประวัติ หรือความคืบหน้า (รีเฟรชแล้วเริ่มใหม่ localStorage ใช้แค่จำภาษา)
- route แบบอื่นนอกจาก hash route (`#/topic/sql`) และต้องคง `base: './'` ไว้

## คำสั่ง
```bash
npm ci
npm run dev            # http://localhost:5173
npm run check:content  # ตรวจเนื้อหาแบบ strict
npm test               # node --test tests/*.test.mjs
npm run build          # check:content แล้ว vite build -> dist/
```
Node 20.19+ หรือ 22.12+ (CI ใช้ 24) ก่อน commit ต้องผ่าน `npm run check:content` และ `npm test`
push ขึ้น `main` แล้ว `.github/workflows/deploy.yml` จะ deploy GitHub Pages ทันที

## โครงสร้าง
- `content/topics/<id>.json` และ `content/en/topics/<id>.json` เนื้อหาแต่ละหัวข้อ ชื่อไฟล์ต้องตรงกับ `id`
- `content/AUTHORING.md` กติกาการเขียนเนื้อหา อ่านก่อนแก้เนื้อหาทุกครั้ง
- `src/lib/validate.js` ตัวตรวจเนื้อหา, `src/lib/markdown.js`, `src/lib/checks.js`
- `src/components/` หน้า Home, TopicPage, QuestionRunner, Exercise, Practice, Exams, ImportPage, ArisePage

## กติกาเนื้อหาหัวข้อ
- ภาษาไทย ไม่ใช้ emoji ข้อเท็จจริงต้องถูกต้อง ณ ปัจจุบัน ห้ามแต่งเวอร์ชันหรือชื่อ package
- ต่อหัวข้อ: mustKnow 24 เรื่อง (must 10–12, should 7–8, advanced 4–5), คำถามสถานการณ์ 30 ข้อมีคำอธิบายทุกข้อ, แบบฝึกหัด 3 ข้อ (ง่าย/กลาง/ยาก), `refs[]` 4–8 รายการ เรื่องใหม่ต้องมี `ref` ที่เปิดตรวจแล้ว
- ห้ามอ้างว่าเคยออกข้อสอบของที่ใดโดยไม่มีที่มา
- ฉบับอังกฤษต้องตรงกับฉบับไทยทีละข้อ (ตรวจโดย `npm test`)

## ชุดฝึก Arise (สำคัญเรื่องความปลอดภัย)
- repo เป็น **public** ต้นฉบับ `private/arise/th.json` และ `en.json` อยู่นอก git (`.gitignore`) **ห้าม commit ไฟล์ใน `private/` และ `Arise_Exam_Practice.html`**
- ขึ้นเว็บเฉพาะ `public/arise.enc.json` ที่เข้ารหัสแล้ว แก้ต้นฉบับแล้วเข้ารหัสใหม่ด้วย `ARISE_PASSCODE='...' node scripts/encrypt-arise.mjs` แล้ว commit ไฟล์ `.enc.json`
- อินโฟกราฟิกและ PDF เผยแพร่เฉพาะ `public/arise-media/*.enc.json` ที่เข้ารหัสด้วยรหัส Arise เดิม สร้างด้วย `node scripts/encrypt-arise-media.mjs` ต้นฉบับใน `private/arise/infographics/` ห้ามนำขึ้น public
- **ห้ามเขียนรหัสลงไฟล์ใดใน repo** ทั้งโค้ด เอกสาร ข้อความ commit และ test
- ห้ามตัดโจทย์หรือข้อมูลของชุดนี้ออก ตรวจโครงสร้างด้วย `checkEdition` และ `checkParity` ใน `src/lib/arise.js` (ชุดนี้ไม่ใช้กติกา 24/30/3)
- cheatsheet ทุกข้อต้องมีที่มาจากเฉลย เหตุผล หรือหมายเหตุของโจทย์ คงคำอย่าง "อาจ" "โดยทั่วไป" และเงื่อนไขไว้ ห้ามเอาตัวเลือกผิดมาเป็นกฎ ฉากเปิด (`story`) เป็นเรื่องสมมติ ห้ามมีข้อเท็จจริงทางเทคนิคเพิ่ม

## ในโฟลเดอร์นี้แต่ไม่ใช่ส่วนของโปรเจกต์
`exam-prep-30-days/` เป็นงานอีกชิ้น ห้ามแก้และห้าม commit
