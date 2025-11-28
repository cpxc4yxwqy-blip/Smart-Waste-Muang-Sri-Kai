import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import webpush from 'web-push';
import bcrypt from 'bcrypt';
import cron from 'node-cron';

import { User } from './models/User';
import { Subscription } from './models/Subscription';
import { authenticate, authorize, generateToken, AuthRequest } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-smart';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// VAPID setup
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const CONTACT = process.env.PUSH_CONTACT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('❌ Missing VAPID keys');
  process.exit(1);
}

webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Auth routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'viewer'
    });

    await user.save();

    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Push subscription routes
app.post('/api/push/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.user!.id;
    const role = req.user!.role;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    // Remove old subscriptions for same endpoint
    await Subscription.deleteMany({ endpoint: subscription.endpoint });

    const newSub = new Subscription({
      userId,
      role,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    await newSub.save();

    const total = await Subscription.countDocuments();
    console.log(`[Subscribe] user=${userId}, role=${role}, total=${total}`);

    res.json({ success: true, total });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

app.post('/api/push/unsubscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    
    const result = await Subscription.deleteOne({ endpoint });
    
    console.log(`[Unsubscribe] endpoint=${endpoint?.substring(0, 50)}..., removed=${result.deletedCount}`);
    res.json({ success: true, removed: result.deletedCount });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Unsubscribe failed' });
  }
});

// Send push (admin only)
app.post('/api/push/send', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, targetRoles, payload } = req.body;

    if (!title && !body) {
      return res.status(400).json({ error: 'Title or body required' });
    }

    let query: any = {};
    if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
      query.role = { $in: targetRoles };
    }

    const subscriptions = await Subscription.find(query);
    console.log(`[Send] title="${title}", targetRoles=${JSON.stringify(targetRoles)}, targets=${subscriptions.length}`);

    const notificationPayload = JSON.stringify({
      title: title || 'Smart Waste Notification',
      body: body || '',
      payload: payload || {}
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        }, notificationPayload)
      )
    );

    // Clean up expired subscriptions
    const expiredIds: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const statusCode = (r.reason as any)?.statusCode || (r.reason as any)?.status;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(subscriptions[i]._id.toString());
        }
      }
    });

    if (expiredIds.length > 0) {
      await Subscription.deleteMany({ _id: { $in: expiredIds } });
      console.log(`[Cleanup] Removed ${expiredIds.length} expired subscriptions`);
    }

    // Update lastNotified
    const successIds = results
      .map((r, i) => r.status === 'fulfilled' ? subscriptions[i]._id : null)
      .filter(id => id !== null);
    
    await Subscription.updateMany(
      { _id: { $in: successIds } },
      { $set: { lastNotified: new Date() } }
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;
    const total = await Subscription.countDocuments();

    res.json({ success: true, sent, failed, expired: expiredIds.length, total });
  } catch (error) {
    console.error('Send push error:', error);
    res.status(500).json({ error: 'Send failed' });
  }
});

// Get subscriptions (admin only)
app.get('/api/push/subscriptions', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await Subscription.find().select('-keys').lean();
    const summary = subscriptions.map(s => ({
      userId: s.userId,
      role: s.role,
      endpoint: s.endpoint.substring(0, 60) + '...',
      createdAt: s.createdAt,
      lastNotified: s.lastNotified
    }));
    
    res.json({ total: subscriptions.length, subscriptions: summary });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Scheduled push notifications (example: daily reminder)
cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Running daily reminder...');
  try {
    const adminSubs = await Subscription.find({ role: 'admin' });
    const payload = JSON.stringify({
      title: 'Smart Waste Daily Reminder',
      body: 'อย่าลืมตรวจสอบข้อมูลการจัดการขยะประจำวัน',
      payload: { type: 'daily_reminder' }
    });

    for (const sub of adminSubs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
        }, payload);
      } catch (err) {
        console.error('Scheduled push error for sub:', sub._id, err);
      }
    }
    
    console.log(`[Cron] Sent daily reminder to ${adminSubs.length} admins`);
  } catch (error) {
    console.error('[Cron] Daily reminder failed:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Backend running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login\n`);
});

export default app;
