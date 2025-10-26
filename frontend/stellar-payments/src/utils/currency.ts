// Mock conversion rates
const RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  MXN: 0.051,
};

export function convertToUSDC(amount: number, currency: string): number {
  const rate = RATES[currency] || 1.0;
  const usdcAmount = amount * rate;
  // Convert to stroops (7 decimals)
  return Math.floor(usdcAmount * 10000000);
}

export function formatUSDC(stroops: number): string {
  return (stroops / 10000000).toFixed(2);
}
