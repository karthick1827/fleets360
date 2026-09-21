# Deploy Fleet 360 (GitHub + Vercel)

## Prerequisites

- Git: use `C:\Users\karthick.natarajan\AppData\Local\Programs\Git\bin\git.exe` (the `cmd\git.exe` wrapper can break `git commit` on this machine).
- GitHub repo named **fleets360** under your account (empty, no README if you already committed locally).
- Vercel account linked to the same GitHub account.

## 1. Push to GitHub

Create the repo on GitHub: **New repository** → name `fleets360` → **do not** add a README if this folder already has commits.

From the project root:

```powershell
cd c:\Users\karthick.natarajan\fleets360
$git = "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"

# Set your real GitHub remote (replace YOUR_GITHUB_USERNAME)
& $git remote remove origin 2>$null
& $git remote add origin https://github.com/karthick1827/fleets360.git

& $git push -u origin main
```

If Git asks for credentials, sign in with GitHub (HTTPS + Credential Manager) or use a [personal access token](https://github.com/settings/tokens) as the password.

Optional — GitHub CLI after install:

```powershell
gh auth login
gh repo create fleets360 --public --source=. --remote=origin --push
```

## 2. Deploy on Vercel

### Option A — Git integration (recommended)

1. Open [https://vercel.com/new](https://vercel.com/new)
2. Import **YOUR_GITHUB_USERNAME/fleets360**
3. Framework preset: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

`vercel.json` already includes SPA rewrites so `/login`, `/home`, `/profile`, etc. work on refresh.

### Option B — CLI

```powershell
cd c:\Users\karthick.natarajan\fleets360
npx vercel login
npx vercel --prod
```

Or set `VERCEL_TOKEN` from [Vercel account tokens](https://vercel.com/account/tokens) and run:

```powershell
$env:VERCEL_TOKEN = "your-token"
npx vercel --prod --yes
```

## 3. Environment variables (optional)

| Variable | Purpose |
| --- | --- |
| `VITE_AUTH_STUB` | Set to `false` when a real auth API is wired |
| `VITE_AUTH_API_URL` | Auth API base URL (see `src/api/authClient.js`) |
| `VITE_TERMS_URL` / privacy URLs | See `src/config/legal.js` |

## 4. Verify production

- Open the Vercel deployment URL → `/login`
- Sign in (dev stub: any valid email + non-empty password)
- Confirm navbar, profile menu, theme, and sign out on `/home`
