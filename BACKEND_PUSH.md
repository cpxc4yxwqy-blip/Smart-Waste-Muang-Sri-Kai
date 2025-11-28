# Backend Push & Segmentation

## Overview
This backend (in `backend/server.ts`) provides endpoints to store Web Push subscriptions and send role-targeted notifications.

## Endpoints
- `POST /api/push/subscribe` { subscription, role }
- `DELETE /api/push/unsubscribe` { endpoint }
- `GET /api/push/subscriptions?role=admin` lists endpoints (sanitized)
- `POST /api/push/send` { title, body, role? }
  - If `role` omitted: broadcast to all.

## Roles
Client passes one of: `default`, `staff`, `admin`. You can extend easily.

## Auto Resubscribe
Service worker re-subscribes inside `pushsubscriptionchange` if public key is available and posts with role `default`, then notifies clients to refresh subscription manually if role-specific segmentation needed.

## Running Backend
```powershell
npm run backend:start
```
By default listens on port `4000`. Adjust `PORT` env var if needed.

## VAPID Keys (.env)
```
VAPID_PUBLIC_KEY=...      # same as VITE_VAPID_PUBLIC_KEY
VITE_VAPID_PUBLIC_KEY=... # exposed to client
VAPID_PRIVATE_KEY=...     # only server-side
PUSH_CONTACT=mailto:admin@example.com
```

## Send Notification via Backend
```powershell
curl -X POST http://localhost:4000/api/push/send ^
  -H "Content-Type: application/json" ^
  -d '{"title":"ทดสอบ","body":"ข้อความแจ้งเตือน","role":"staff"}'
```

## Production Notes
- Replace JSON file storage with a real DB (PostgreSQL, Redis, etc.).
- Deduplicate by `endpoint` & maintain last-seen timestamp.
- Remove expired subs on 404/410 responses (already implemented partial cleanup).
- Consider batching send & error handling queue.

## Security
- Never expose `VAPID_PRIVATE_KEY` publicly.
- Validate incoming subscription structure.
- Add rate limiting for `/api/push/send`.

## Extending Roles
Add UI options & pass new role to `subscribeUser(role)`; backend automatically stores.

