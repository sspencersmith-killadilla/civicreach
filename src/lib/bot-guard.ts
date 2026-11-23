// Lightweight spam protection for public resident forms: a hidden honeypot field plus a minimum fill time.
export const MIN_FILL_MS = 3000;
export function looksAutomated(honeypot: string, startedAt: number, now = Date.now()): boolean {
  return honeypot.trim().length > 0 || now - startedAt < MIN_FILL_MS;
}
