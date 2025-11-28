#!/usr/bin/env node
/* Mock Backend for Push Notifications
 * Provides in-memory storage for subscriptions with role-based segmentation
 * Run: node server/mock-push-backend.mjs
 * Requires: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY in .env
 */

import express from 'express';
import webpush from 'web-push';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage (reset on restart)
let subscriptions = [];

// VAPID setup
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.PUSH_CONTACT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('Missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
  process.exit(1);
}

webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', subscriptions: subscriptions.length });
});

// Subscribe endpoint
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userId, role, metadata } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  
  // Remove duplicate endpoints
  subscriptions = subscriptions.filter(s => s.subscription.endpoint !== subscription.endpoint);
  
  subscriptions.push({
    userId: userId || 'anonymous',
    role: role || 'viewer',
    subscription,
    metadata: metadata || {},
    createdAt: Date.now()
  });
  
  console.log(`[Subscribe] user=${userId}, role=${role}, total=${subscriptions.length}`);
  res.json({ success: true, total: subscriptions.length });
});

// Unsubscribe endpoint
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }
  
  const before = subscriptions.length;
  subscriptions = subscriptions.filter(s => s.subscription.endpoint !== endpoint);
  const removed = before - subscriptions.length;
  
  console.log(`[Unsubscribe] endpoint=${endpoint.substring(0, 50)}..., removed=${removed}`);
  res.json({ success: true, removed });
});

// Send push notification (with role filtering)
app.post('/api/push/send', async (req, res) => {
  const { title, body, targetRoles, payload } = req.body;
  
  if (!title && !body) {
    return res.status(400).json({ error: 'Title or body required' });
  }
  
  // Filter by roles
  let targets = subscriptions;
  if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
    targets = subscriptions.filter(s => targetRoles.includes(s.role));
  }
  
  console.log(`[Send] title="${title}", targetRoles=${JSON.stringify(targetRoles)}, targets=${targets.length}`);
  
  const notificationPayload = JSON.stringify({
    title: title || 'Smart Waste Notification',
    body: body || '',
    payload: payload || {}
  });
  
  const results = await Promise.allSettled(
    targets.map(t => webpush.sendNotification(t.subscription, notificationPayload))
  );
  
  // Clean up expired/invalid subscriptions (410/404)
  const expiredEndpoints = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const statusCode = r.reason?.statusCode || r.reason?.status;
      if (statusCode === 410 || statusCode === 404) {
        expiredEndpoints.push(targets[i].subscription.endpoint);
      }
    }
  });
  
  if (expiredEndpoints.length > 0) {
    subscriptions = subscriptions.filter(s => !expiredEndpoints.includes(s.subscription.endpoint));
    console.log(`[Cleanup] Removed ${expiredEndpoints.length} expired subscriptions`);
  }
  
  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - sent;
  
  res.json({ 
    success: true, 
    sent, 
    failed, 
    expired: expiredEndpoints.length,
    total: subscriptions.length 
  });
});

// List subscriptions (admin debug)
app.get('/api/push/subscriptions', (req, res) => {
  const summary = subscriptions.map(s => ({
    userId: s.userId,
    role: s.role,
    endpoint: s.subscription.endpoint.substring(0, 60) + '...',
    createdAt: new Date(s.createdAt).toISOString()
  }));
  res.json({ total: subscriptions.length, subscriptions: summary });
});

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Mock Push Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Subscriptions: http://localhost:${PORT}/api/push/subscriptions\n`);
});
