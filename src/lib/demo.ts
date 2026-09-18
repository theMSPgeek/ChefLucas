export function isDemoMode() {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
  const webhook =
    process.env.GHL_WEBHOOK_URL || process.env.NEXT_PUBLIC_GHL_FORM_URL;
  if (flag === "false" && webhook) return false;
  return true;
}

export function hasGhlConnection() {
  return Boolean(
    process.env.GHL_WEBHOOK_URL || process.env.NEXT_PUBLIC_GHL_FORM_URL,
  );
}

export function hasStripeKeys() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
