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

## 3. Vercel project settings (required for Markdown Studio APIs)

The **User Control Centre**, JIRA, and Confluence features live in **Markdown Studio** at **`/markdown.html`**, not the React `/home` app. They call `/api/*` routes implemented as **serverless functions**.

This repo uses **`vite-plugin-vercel`**: `npm run build` emits the [Vercel Build Output API](https://vercel.com/docs/build-output-api/v3) under `.vercel/output/` (static files + `/api/*` functions). A plain Vite deploy that only uploads `dist/` **never** deploys those APIs — every `/api/...` call returns **404**.

| Setting | Value |
| --- | --- |
| **Root Directory** | *(empty — repository root)* |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | **Leave empty** (do not set `dist`). The plugin writes `.vercel/output`; Vercel must consume that, not only `dist/`. |
| **Install Command** | `npm ci` (recommended) |

If **Root Directory** is set to `dist` or another subfolder, Vercel deploys only static files and every `/api/...` request returns **404**.

After deploy, open the deployment in the Vercel dashboard → **Deployment Summary** → confirm **Serverless Functions** lists entries such as:

- `/api/git-details`
- `/api/atlassian/config`
- `/api/list-markdown-files`

Quick smoke test in the browser (replace with your deployment host):

- `https://YOUR-DEPLOYMENT.vercel.app/api/git-details` → JSON (not an HTML 404 page)
- `https://YOUR-DEPLOYMENT.vercel.app/markdown.html` → Markdown Studio

### Git identity on production (expected)

`/api/git-details` reads the **GitHub repo linked to the Vercel project** (`VERCEL_GIT_*` variables and `package.json` `repository` URL). It does **not** use your laptop’s `git config`. That is why User Control Centre shows the connected GitHub account and repo, not a local-only remote.

### JIRA & Confluence on Vercel

- Open **Markdown Studio** → **User Control Centre** → **Configure Connection** under Atlassian.
- Credentials are verified by the server, then cached in the browser (`localStorage`) for sync/pull calls (serverless filesystem is ephemeral).
- Optional: commit non-secret defaults in `_acl/atlassian-config.json`; never commit API tokens.

## 4. Environment variables (optional)

| Variable | Purpose |
| --- | --- |
| `VITE_AUTH_STUB` | Set to `false` when a real auth API is wired |
| `VITE_AUTH_API_URL` | Auth API base URL (see `src/api/authClient.js`) |
| `VITE_TERMS_URL` / privacy URLs | See `src/config/legal.js` |
| `GITHUB_TOKEN` / `GH_TOKEN` | Richer GitHub metadata in `/api/git-details` (optional) |

## 5. Verify production

- Open the Vercel deployment URL → `/login`
- Sign in (dev stub: any valid email + non-empty password)
- Confirm navbar, profile menu, theme, and sign out on `/home`
- Open `/markdown.html` → User Control Centre loads without API 404s; configure Atlassian if needed
