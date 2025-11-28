# Web Push Setup

## 1. Generate VAPID Keys
```powershell
npx web-push generate-vapid-keys
```
Output example:
```
Public Key:  BExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: Qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 2. Set Environment Variables (local dev)
Create `.env` file:
```
VITE_VAPID_PUBLIC_KEY=BExxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PUBLIC_KEY=BExxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=Qxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Public key must be exposed with prefix `VITE_` for client build.

## 3. Rebuild & Deploy
```powershell
npm run build
npx gh-pages -d dist
```

## 4. Subscribe in UI
Open the app:
1. Click `เปิดแจ้งเตือน` (grant notification permission)
2. Click `สมัครรับแจ้งเตือน` (stores subscription locally)
Use DevTools console to copy subscription:
```js
JSON.parse(localStorage.getItem('push_subscription'))
```
Save JSON into a file: `sub.json`.

## 5. Send Test Push
```powershell
node -r dotenv/config scripts/send-test-push.mjs sub.json "แจ้งเตือนทดสอบ" "Push สำเร็จ"
```
If successful, a notification should appear.

## 6. Unsubscribe
Click `ยกเลิกแจ้งเตือน` button. Subscription endpoint becomes invalid (server should remove it).

## 7. Production Considerations
- Store subscriptions in a backend DB (include user/context identifiers).
- Filter duplicates by endpoint URL.
- Batch send; respect daily limits; implement retry/backoff.
- Payload size limit ~4KB; keep JSON small.

## 8. Security & Privacy
- Never expose private VAPID key client-side.
- Allow users to opt out easily.
- Avoid sending sensitive data in payload; fetch detailed content after notification click.

## 9. Handling subscriptionchange
Browsersอาจหมุนเวียน (rotate) key ทำให้ subscription เดิมใช้ไม่ได้:
- Service worker มี handler `pushsubscriptionchange` แล้ว (ดู `src/sw.ts`)
- เมื่อหมดอายุ จะส่ง message `{ type: 'PUSH_SUBSCRIPTION_EXPIRED' }` ไปยังทุก client
- แอป (ดู `App.tsx`) จะตั้งค่า `pushSubscribed` เป็น false เพื่อให้ผู้ใช้สมัครใหม่
แนวทาง auto-resubscribe (ขั้นสูง): ให้ SW เรียก `pushManager.subscribe` อีกครั้งถ้ามี VAPID key ฝัง และ POST ส่งไป backend โดยไม่รบกวนผู้ใช้

## 10. Cleanup & Expiry
Periodically validate stored subscriptions: send with TTL header; remove those returning 410/404.
