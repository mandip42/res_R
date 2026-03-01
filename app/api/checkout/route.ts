import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const PLAN_TO_PRICE_ID: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  pro_year: process.env.STRIPE_PRO_YEAR_PRICE_ID ?? "",
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID ?? "",
};

/** POST: create a Stripe Checkout session for the chosen plan. User must be logged in. */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const body = await req.json();
    const planKey = (body.plan as string) || "pro"; // 'pro' | 'pro_year' | 'lifetime'

    const priceId = PLAN_TO_PRICE_ID[planKey];
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan. Use pro, pro_year, or lifetime." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripe = getStripe();

    const isSubscription = planKey === "pro"; // Pro monthly = subscription; pro_year & lifetime = one-time
    const sessionPlan = planKey === "lifetime" ? "lifetime" : "pro";

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/pricing`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan: sessionPlan,
      },
    };
    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
