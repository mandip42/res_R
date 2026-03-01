import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

/** Stripe sends raw body; we must not parse JSON so signature verification works. */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("Stripe webhook: missing signature or STRIPE_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook misconfigured" }, { status: 500 });
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      console.error("Stripe webhook signature verification failed", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.user_id;
      const plan = (session.metadata?.plan as "pro" | "lifetime") ?? "pro";
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

      if (!userId) {
        console.error("Stripe webhook: no user_id in session", session.id);
        return NextResponse.json({ error: "No user_id" }, { status: 400 });
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Stripe webhook: missing Supabase env vars");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const updates: { plan: string; stripe_customer_id?: string } = { plan };
      if (customerId) updates.stripe_customer_id = customerId;

      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        console.error("Stripe webhook: failed to update user plan", updateError);
        return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
      }

      console.log("Stripe webhook: updated user", userId, "to plan", plan);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
