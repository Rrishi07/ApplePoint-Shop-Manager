# ApplePoint production deployment

Recommended simple production setup for one shop:

- Frontend: Firebase Hosting
- Backend: Render paid Web Service
- Persistent data + photos: Render Persistent Disk mounted at `/var/data`
- Authentication: Firebase Authentication

The Render disk is required because the application uses SQLite and local image uploads.

## Render environment variables

```env
APP_NAME=ApplePoint
SECRET_KEY=<new production secret>
ACCESS_TOKEN_MINUTES=720
DATABASE_URL=sqlite:////var/data/applepoint.db
UPLOAD_DIR=/var/data/uploads
FRONTEND_ORIGINS=https://applepoint-shop.web.app,https://applepoint-shop.firebaseapp.com
LOW_STOCK_DEFAULT=3
AUTH_PROVIDER=firebase
FIREBASE_WEB_API_KEY=<Firebase Web API key>
FIREBASE_TIMEOUT_SECONDS=20
VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

Render root directory: `backend`
Build command: `pip install -r requirements.txt`
Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
Health check: `/api/health`
Persistent disk mount path: `/var/data`

## Firebase frontend

Create `frontend/.env.production`:

```env
VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com
```

Then run from `frontend`:

```powershell
npm install
npm run build
firebase init hosting
firebase deploy --only hosting
```

Choose `dist` as the public directory and `Yes` for single-page app rewrites.
