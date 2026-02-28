# Stripe setup – step by step

Use **Test mode** (toggle in Stripe Dashboard) while you’re testing. Switch to **Live** when you’re ready for real payments.

---

## Step 1: Create products and prices in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Product catalog** → **Add product**.
2. Create **three products** (or use existing ones) and add **Prices** to each:

   | Product name | Price type | Amount | Your env variable |
   |--------------|------------|--------|-------------------|
   | Pro (monthly) | Recurring, monthly | $9/mo | `STRIPE_PRO_PRICE_ID` |
   | Pro (yearly)  | One-time **or** recurring yearly | $79 | `STRIPE_PRO_YEAR_PRICE_ID` |
   | Lifetime      | One-time | $149 | `STRIPE_LIFETIME_PRICE_ID` |

3. For each price, open the price and copy the **Price ID** (it starts with `price_`, e.g. `price_1ABC123...`).  
   **Important:** Use the **Price ID**, not the Product ID (which starts with `prod_`).

4. Put these in your `.env.local` (and in Vercel → Settings → Environment Variables):

   ```
   STRIPE_PRO_PRICE_ID=price_xxxxx
   STRIPE_PRO_YEAR_PRICE_ID=price_xxxxx
   STRIPE_LIFETIME_PRICE_ID=price_xxxxx
   ```

---

## Step 2: Webhook (so paying users get Pro/Lifetime on the dashboard)

1. In Stripe Dashboard go to **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:**
   - Local testing: use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward:  
     `stripe listen --forward-to localhost:3000/api/webhooks/stripe`  
     Then put the printed **Signing secret** (e.g. `whsec_...`) in `.env.local` as `STRIPE_WEBHOOK_SECRET`.
   - Production: use your live URL, e.g.  
     `https://your-app.vercel.app/api/webhooks/stripe`
3. Under **Select events**, add:
   - `checkout.session.completed`
4. Click **Add endpoint**. On the new endpoint’s page, open **Reveal** under **Signing secret** and copy it.
5. Set in env:
   - Local: `.env.local` → `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Production: Vercel → Project → Settings → Environment Variables → add `STRIPE_WEBHOOK_SECRET` with the **same** webhook’s signing secret (for production use the endpoint that points to your Vercel URL).

---

## Step 3: Test the flow

1. Run the app locally: `npm run dev`.
2. Log in, go to **Pricing**, click **Upgrade to Pro** (or **$79/year** or **Get Lifetime**).
3. You should be redirected to Stripe Checkout. In Test mode use card `4242 4242 4242 4242`, any future expiry, any CVC.
4. After “paying”, you’re redirected to the dashboard. The webhook runs and updates your plan in the database.
5. Refresh the dashboard: **Plan & billing** should show **Pro** or **Lifetime**, and the “Upgrade plan” button should be gone.

---

## Step 4: When you go live

1. In Stripe, switch to **Live** mode (toggle in the dashboard).
2. Create the same products/prices in Live (or use existing live prices) and set the **live** Price IDs in Vercel env.
3. In **Developers** → **Webhooks**, add a **new** endpoint with URL `https://your-production-domain.com/api/webhooks/stripe`, event `checkout.session.completed`, and copy its **live** signing secret.
4. In Vercel, set **live** Stripe keys and the **live** `STRIPE_WEBHOOK_SECRET` for Production.
5. Redeploy so the new env vars are used.

---

## Summary

- **Checkout:** Pricing page calls `/api/checkout` with `{ plan: 'pro' | 'pro_year' | 'lifetime' }` and redirects to Stripe.
- **Webhook:** Stripe sends `checkout.session.completed` to `/api/webhooks/stripe`; we verify the signature and set `public.users.plan` to `pro` or `lifetime` for the paying user.
- Env vars you need: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and the three `STRIPE_*_PRICE_ID` values (must be **Price** IDs, not Product IDs).
