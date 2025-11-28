# Smart Waste Backend API

Production backend for Smart Waste Management Dashboard with MongoDB, JWT authentication, and scheduled push notifications.

## Features

- **MongoDB**: User and subscription storage with Mongoose ODM
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- **Web Push**: VAPID-based push notifications with role-based targeting
- **Scheduled Jobs**: node-cron for daily reminders and periodic notifications
- **Security**: helmet, express-rate-limit, CORS protection
- **Cloud Ready**: Configured for Render.com deployment

## Local Development

### Prerequisites

- Node.js 18+ or 20+
- MongoDB (local or Atlas)
- VAPID keys (generate with `npx web-push generate-vapid-keys`)

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values (MongoDB URI, JWT secret, VAPID keys)

# Start development server with hot reload
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
MONGODB_URI=mongodb://localhost:27017/waste-smart
JWT_SECRET=your-super-secret-jwt-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
PUSH_CONTACT=mailto:admin@yourdomain.com
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
  ```json
  {
    "username": "john",
    "email": "john@example.com",
    "password": "securepass",
    "role": "viewer" // optional: viewer | staff | admin
  }
  ```

- `POST /api/auth/login` - Login and get JWT token
  ```json
  {
    "username": "john",
    "password": "securepass"
  }
  ```

### Push Subscriptions (Protected)

All subscription endpoints require `Authorization: Bearer <token>` header.

- `POST /api/push/subscribe` - Subscribe to push notifications
  ```json
  {
    "subscription": {
      "endpoint": "https://...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  }
  ```

- `POST /api/push/unsubscribe` - Unsubscribe from push
  ```json
  {
    "endpoint": "https://..."
  }
  ```

- `POST /api/push/send` - Send push notification (Admin only)
  ```json
  {
    "title": "Alert",
    "body": "Message body",
    "targetRoles": ["admin", "staff"], // optional
    "payload": {} // optional custom data
  }
  ```

- `GET /api/push/subscriptions` - List all subscriptions (Admin only)

### Health Check

- `GET /health` - Server status and DB connection

## Scheduled Jobs

The server runs automated cron jobs:

- **Daily Reminder** (9:00 AM): Sends push notification to all admins
  - Configured in `src/index.ts` with `cron.schedule('0 9 * * *', ...)`
  - Modify schedule pattern to customize timing

## Production Deployment (Render.com)

### Option 1: Using render.yaml (Recommended)

1. Push code to GitHub
2. Connect Render.com to your repository
3. Render will detect `render.yaml` and auto-configure
4. Add environment variables in Render dashboard:
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
   - `CORS_ORIGIN` (your frontend URL)

### Option 2: Manual Setup

1. Create new Web Service on Render.com
2. Connect GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables (see `.env.example`)

### MongoDB Setup

Use MongoDB Atlas (free tier):
1. Create cluster at mongodb.com
2. Create database user
3. Whitelist Render.com IPs (or use 0.0.0.0/0)
4. Copy connection string to `MONGODB_URI`

## Build & Run

```bash
# Development (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Production
npm start

# Test
npm test
```

## Security Considerations

- Change `JWT_SECRET` to a strong random string in production
- Use MongoDB Atlas or secure MongoDB instance (not exposed to public)
- Set `CORS_ORIGIN` to your actual frontend domain
- Keep VAPID private key secure (never commit to git)
- Rate limiting enabled (100 requests per 15 minutes per IP)
- Helmet.js security headers enabled

## Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.ts           # User schema (auth)
│   │   └── Subscription.ts   # Push subscription schema
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication/authorization
│   └── index.ts              # Main server + routes + cron jobs
├── package.json
├── tsconfig.json
├── Dockerfile
├── render.yaml               # Render.com config
└── .env.example
```

## License

ISC
