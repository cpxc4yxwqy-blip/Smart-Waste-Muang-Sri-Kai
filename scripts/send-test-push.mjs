#!/usr/bin/env node
// Simple test push sender. Usage:
// node scripts/send-test-push.mjs <subscription-json-file> "Title" "Message body"
// Requires VAPID keys. Generate with:
// npx web-push generate-vapid-keys
// Then set env vars VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY or create .env and run with: node -r dotenv/config ...

import webpush from 'web-push';
import fs from 'fs';

const [,, subFile, titleArg, bodyArg] = process.argv;
if (!subFile) {
  console.error('Subscription file required.');
  process.exit(1);
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys in env.');
  process.exit(1);
}

webpush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const subRaw = fs.readFileSync(subFile, 'utf-8');
const subscription = JSON.parse(subRaw);

const payload = {
  title: titleArg || 'Test Push',
  body: bodyArg || 'Hello from test push',
  payload: { ts: Date.now() }
};

webpush.sendNotification(subscription, JSON.stringify(payload))
  .then(res => { console.log('Push sent', res.statusCode); })
  .catch(err => { console.error('Push error', err); process.exit(1); });
