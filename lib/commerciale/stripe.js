import Stripe from "stripe";

let stripeClient;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY non configurata");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      appInfo: { name: "Hoon Gestionale Commerciale", version: "1.0.0" },
    });
  }
  return stripeClient;
}

export function assertStripeTestMode() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.STRIPE_ALLOW_LIVE_MODE !== "true" &&
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
  ) {
    throw new Error("Stripe Live Mode bloccata: usa una chiave test o abilita esplicitamente STRIPE_ALLOW_LIVE_MODE");
  }
}

