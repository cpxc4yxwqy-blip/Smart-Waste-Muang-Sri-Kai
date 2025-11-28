import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import webpush from 'web-push';

const PORT = process.env.PORT || 4000;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.PUSH_CONTACT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('[Backend] Missing VAPID keys. Push send will fail until provided.');
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const app = express();
app.use(cors());
app.use(express.json());

interface StoredSubscription {
  endpoint: string;
  subscription: any;
  role: string;
  createdAt: number;
}

const storageFile = path.resolve(__dirname, 'subscriptions.json');

function loadSubscriptions(): StoredSubscription[] {
  try {
    if (!fs.existsSync(storageFile)) return [];
    const raw = fs.readFileSync(storageFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading subscriptions', e);
    return [];
  }
}
function saveSubscriptions(data: StoredSubscription[]) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing subscriptions', e);
  }
}

app.get('/api/push/subscriptions', (req, res) => {
  const role = (req.query.role as string) || undefined;
  let subs = loadSubscriptions();
  if (role) subs = subs.filter(s => s.role === role);
  res.json(subs.map(s => ({ endpoint: s.endpoint, role: s.role, createdAt: s.createdAt })));
});

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, role } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  const subs = loadSubscriptions();
  const existingIndex = subs.findIndex(s => s.endpoint === subscription.endpoint);
  if (existingIndex >= 0) {
    subs[existingIndex].role = role || subs[existingIndex].role;
    subs[existingIndex].subscription = subscription;
  } else {
    subs.push({ endpoint: subscription.endpoint, subscription, role: role || 'default', createdAt: Date.now() });
  }
  saveSubscriptions(subs);
  res.json({ ok: true });
});

app.delete('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  const subs = loadSubscriptions().filter(s => s.endpoint !== endpoint);
  saveSubscriptions(subs);
  res.json({ ok: true });
});

app.post('/api/push/send', async (req, res) => {
  const { title, body, role } = req.body;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  const subs = loadSubscriptions().filter(s => !role || s.role === role);
  const payloadBase = { title: title || 'Notification', body: body || 'New update', payload: { ts: Date.now(), role: role || 'all' } };
  const results: any[] = [];
  for (const s of subs) {
    try {
      const r = await webpush.sendNotification(s.subscription, JSON.stringify(payloadBase));
      results.push({ endpoint: s.endpoint, statusCode: r.statusCode });
    } catch (err: any) {
      console.error('Push error', err.statusCode, err.body);
      results.push({ endpoint: s.endpoint, error: err.statusCode || err.message });
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Remove expired subscription
        const left = subs.filter(x => x.endpoint !== s.endpoint);
        saveSubscriptions(left);
      }
    }
  }
  res.json({ sent: results.length, results });
});

app.listen(PORT, () => {
  console.log(`[Backend] Listening on port ${PORT}`);
});
