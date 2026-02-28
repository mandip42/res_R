# Hosting Checklist – Roast My Resume

Use this checklist to deploy your Next.js app to the public.

---

## 1. Put your code in Git (if not already)

```powershell
cd c:\Users\gomandip\Documents\Cursor_Project\Resume_Roast
git init
git add .
git commit -m "Initial commit"
```

Create a repo on **GitHub** (or GitLab/Bitbucket), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Important:** Never commit `.env.local`. It should be in `.gitignore` (Next.js usually adds it by default).

---

## 2. Deploy on Vercel (recommended for Next.js)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New** → **Project** and import your Git repository.
3. Vercel will detect Next.js; leave the defaults and click **Deploy**.
4. After the first deploy, you’ll get a URL like `https://your-project.vercel.app`.

---

## 3. Add environment variables in Vercel

In the Vercel project: **Settings** → **Environment Variables**. Add every variable from your `.env.local` for **Production** (and Preview if you use preview deployments):

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | Same as local |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as local |
| `STRIPE_SECRET_KEY` | Use **live** key when you go live; keep test for staging |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Use **live** key when you go live |
| `STRIPE_WEBHOOK_SECRET` | **New value** – see Step 5 below |
| `STRIPE_PRO_PRICE_ID` | Same (or live IDs when switching) |
| `STRIPE_PRO_YEAR_PRICE_ID` | Same |
| `STRIPE_LIFETIME_PRICE_ID` | Same |
| `ADMIN_EMAIL` | Same as local |
| **`NEXT_PUBLIC_APP_URL`** | **Set to your live URL**, e.g. `https://your-project.vercel.app` or your custom domain |

Redeploy after adding or changing variables (Vercel → Deployments → ⋮ on latest → Redeploy).

---

## 4. Supabase – allow your production URL

If you use Supabase Auth (sign in, sign up, redirects):

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**.
2. Add your production URL to **Site URL** and **Redirect URLs**, e.g.:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

---

## 5. Stripe – production webhook

Your app has `STRIPE_WEBHOOK_SECRET` in `.env.local`. For production you need a webhook that points to your live site:

1. In [Stripe Dashboard](https://dashboard.stripe.com) go to **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. **Endpoint URL:** `https://your-project.vercel.app/api/webhooks/stripe`  
   (If you don’t have this route yet, create it; otherwise use the route where you handle Stripe events.)
4. Select the events you need (e.g. `checkout.session.completed`, `customer.subscription.updated`, etc.).
5. Create the endpoint; Stripe will show a **Signing secret** (starts with `whsec_`).
6. Add that as **`STRIPE_WEBHOOK_SECRET`** in Vercel environment variables (Production), then redeploy.

For **live** payments, repeat in the **Live** mode of Stripe and use the live webhook secret in production.

---

## 6. Verify the build locally (optional but recommended)

```powershell
npm run build
npm run start
```

If this works, Vercel’s build should succeed too.

---

## 7. Custom domain (optional)

1. In Vercel: Project → **Settings** → **Domains**.
2. Add your domain (e.g. `roastmyresume.app`) and follow the DNS instructions.
3. After the domain is active, set **`NEXT_PUBLIC_APP_URL`** in Vercel to `https://roastmyresume.app` and update Supabase redirect URLs and Stripe webhook URL to use that domain. Then redeploy.

---

## Quick reference

- **Vercel:** [vercel.com](https://vercel.com) – deploy and env vars  
- **Supabase:** Dashboard → Authentication → URL Configuration  
- **Stripe:** Dashboard → Developers → Webhooks  
- **App URL:** Always set `NEXT_PUBLIC_APP_URL` to your real public URL (no `localhost` in production)

After each change to env vars or Stripe/Supabase URLs, trigger a **Redeploy** in Vercel so the new config is used.
