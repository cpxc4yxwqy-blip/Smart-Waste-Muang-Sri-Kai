# Smart Waste Backend - Render.com Deployment Guide

## 🚀 Quick Deploy Steps

### 1. Push Code to GitHub
```bash
git add backend/
git commit -m "feat: add production backend with MongoDB and JWT auth"
git push origin main
```

### 2. Setup MongoDB Atlas (Free Tier)
1. Go to [mongodb.com](https://www.mongodb.com/cloud/atlas/register)
2. Create free M0 cluster (512 MB)
3. **Database Access**: Create user with password
4. **Network Access**: Add IP `0.0.0.0/0` (allow from anywhere)
5. **Connect**: Copy connection string
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/waste-smart`

### 3. Deploy to Render.com
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. **New** → **Web Service**
4. Connect your repository: `cpxc4yxwqy-blip/Smart-Waste-Muang-Sri-Kai`
5. Configure:
   - **Name**: `waste-smart-backend` (or your choice)
   - **Region**: Oregon (Free)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 4. Environment Variables (Render Dashboard)
Click "Advanced" → Add the following:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/waste-smart
JWT_SECRET=<generate strong random string>
VAPID_PUBLIC_KEY=<your public key from .env>
VAPID_PRIVATE_KEY=<your private key from .env>
PUSH_CONTACT=mailto:your-email@example.com
CORS_ORIGIN=https://<your-github-username>.github.io
PORT=3001
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy
- Click **Create Web Service**
- Wait for build (~5-10 minutes)
- Check logs for "✅ Backend running on port 3001"
- Note your URL: `https://waste-smart-backend.onrender.com`

### 6. Update Frontend
Edit `.env` in your main project:
```env
VITE_BACKEND_URL=https://waste-smart-backend.onrender.com
```

Then rebuild and redeploy frontend:
```bash
npm run build
git add -A
git commit -m "feat: connect to production backend on Render"
git push origin main
```

## 🧪 Testing After Deployment

### Health Check
```bash
curl https://waste-smart-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T...",
  "db": "connected"
}
```

### Test Registration
```bash
curl -X POST https://waste-smart-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "username": "testuser",
    "role": "admin"
  }
}
```

### Test Login
```bash
curl -X POST https://waste-smart-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## ⚠️ Important Notes

### Free Tier Limitations
- Backend will **sleep after 15 minutes** of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month free (enough for one service 24/7)

### Keep-Alive Strategy
Create a cron job to ping your backend every 10 minutes:
```bash
# Using cron-job.org or similar
GET https://waste-smart-backend.onrender.com/health
# Interval: every 10 minutes
```

### Security Best Practices
- ✅ Never commit `.env` with real credentials
- ✅ Use strong JWT_SECRET (64+ characters)
- ✅ Keep VAPID private key secret
- ✅ Set specific CORS_ORIGIN (not `*`)
- ✅ Use MongoDB Atlas IP whitelist if possible

## 🔧 Troubleshooting

### Build Fails
- Check `package.json` has all dependencies
- Verify TypeScript compiles locally: `npm run build`
- Check Render logs for specific errors

### Database Connection Error
- Verify MONGODB_URI format
- Check MongoDB Atlas user password (no special chars or URL-encode)
- Confirm IP whitelist includes `0.0.0.0/0`
- Test connection string locally first

### 401 Unauthorized
- Check JWT token is included: `Authorization: Bearer <token>`
- Verify JWT_SECRET matches between requests
- Token may have expired (check expiry time)

### CORS Errors
- Verify CORS_ORIGIN matches your GitHub Pages URL exactly
- Check `https://` protocol (not `http://`)
- Try `*` temporarily for testing (then restrict)

## 📊 Monitoring

### Render Dashboard
- View real-time logs
- Check memory/CPU usage
- See deployment history
- Monitor request metrics

### MongoDB Atlas
- Monitor database connections
- View query performance
- Check storage usage
- Set up alerts

## 🔄 Updates & Redeployment

When you push code changes:
```bash
git add backend/
git commit -m "fix: update backend logic"
git push origin main
```

Render auto-deploys from `main` branch. Manual redeploy option also available in dashboard.

## 📝 Useful Commands

```bash
# View backend logs locally
cd backend
npm run dev

# Build and test production build
npm run build
npm start

# Test with local MongoDB
docker run -d -p 27017:27017 mongo
# Then set MONGODB_URI=mongodb://localhost:27017/waste-smart
```

## 🆘 Support Resources

- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Backend README](./backend/README.md)
