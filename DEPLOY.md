# Deploying TH Field Intelligence to Vercel

This app is a static Expo Web export. The entire 17-screen app runs as a single-page web app on Vercel and works on desktop, laptop, iPad and mobile browsers.

## One-time setup

1. Push this repo to GitHub (Settings → Save to GitHub inside Emergent does this).
2. Go to https://vercel.com/new and import the GitHub repo.
3. Vercel will detect `vercel.json` at the repo root. You don't need to change any settings.
4. Add one environment variable in Vercel → Project Settings → Environment Variables:

   | Key | Value |
   |-----|-------|
   | `EXPO_PUBLIC_BACKEND_URL` | URL of your deployed FastAPI backend (see below). Leave blank if you only need the offline features — only AI Insights uses the backend. |

5. Click **Deploy**. Build takes ~2–4 minutes. You'll get a `https://<your-project>.vercel.app` URL that works on every device.

## What `vercel.json` does

```json
{
  "buildCommand": "cd frontend && yarn install --frozen-lockfile && npx expo export --platform web",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- Runs `expo export` which produces a static `frontend/dist` folder
- Vercel serves that folder as a pure static site (no server runtime needed)
- The rewrite makes Expo Router's client-side routes (like `/performance`, `/calculator`) work on direct-URL loads or page refreshes

## Backend (optional — only needed for AI Insights)

The offline features (surveys, customers, performance KPIs, exports, calculator) work **without any backend**. Only the "AI Insights Feed" screen needs the FastAPI service.

### Options to host the backend

| Host | Difficulty | Free tier | Notes |
|------|-----------|-----------|-------|
| **Railway** | Easiest | 500 hrs/mo | Click "Deploy from GitHub" → select the `backend/` folder → set `EMERGENT_LLM_KEY` env var |
| **Render** | Easy | Yes | Similar flow; use `uvicorn server:app --host 0.0.0.0 --port $PORT` as the start command |
| **Fly.io** | Medium | Yes | Best if you want EU/US latency choice |

Once deployed, copy the backend URL (e.g. `https://th-backend.up.railway.app`) and paste it as `EXPO_PUBLIC_BACKEND_URL` in Vercel. Redeploy the frontend and the Insights screen will work.

## Env vars the app uses

| Var | Where | Required |
|-----|-------|----------|
| `EXPO_PUBLIC_BACKEND_URL` | Frontend (Vercel) | Only for AI Insights |
| `EMERGENT_LLM_KEY` | Backend only | Required if you deploy backend |

## Responsive behaviour

- **Mobile phones**: full-width, bottom tab bar
- **iPad / laptop / desktop**: content is centred in a 640 px column with padding on both sides so text and cards don't stretch to 2000 px wide
- All charts, leaderboards, and forms auto-adapt
- Pull-to-refresh works on touch devices

## Local build test

```bash
cd frontend
npx expo export --platform web
npx serve dist   # visit http://localhost:3000
```

## Updating after first deploy

Every push to the connected GitHub branch auto-deploys. No further steps.

## Data storage on the web

All user data (surveys, customers, KPIs, pipeline, notes, settings) lives in the browser's `localStorage` for that device. Different devices = different data. Use the **Export → Share All Data** screen weekly to back up to Drive / email.
