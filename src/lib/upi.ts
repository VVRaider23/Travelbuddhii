export interface UpiPaymentParams {
  pa: string;  // UPI ID (payee address)
  pn: string;  // Payee name
  am: number;  // Amount in INR
  tn: string;  // Transaction note
}

export function buildUpiDeepLink(params: UpiPaymentParams): string {
  const { pa, pn, am, tn } = params;
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am.toFixed(2)}&tn=${encodeURIComponent(tn)}&cu=INR`;
}

// Shareable HTTPS redirect URL for WhatsApp (upi:// doesn't auto-link in WhatsApp)
export function buildUpiRedirectUrl(
  baseUrl: string,
  params: UpiPaymentParams
): string {
  const { pa, pn, am, tn } = params;
  return `${baseUrl}/pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am.toFixed(2)}&tn=${encodeURIComponent(tn)}`;
}
