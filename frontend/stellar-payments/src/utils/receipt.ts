export function generateReceiptText(data: {
  merchantName: string;
  amount: number;
  currency: string;
  amountUSDC: number;
  payerAddress: string;
  txHash: string;
  timestamp: string;
}): string {
  return `
═══════════════════════════════
    PAYMENT RECEIPT
═══════════════════════════════

Merchant: ${data.merchantName}
Date: ${new Date(data.timestamp).toLocaleString()}

AMOUNT PAID
${data.currency} ${data.amount.toFixed(2)}
${(data.amountUSDC / 10000000).toFixed(2)} USDC

TRANSACTION DETAILS
Payer: ${data.payerAddress}
TX Hash: ${data.txHash}

Network: Stellar Testnet
View on Explorer:
https://stellar.expert/explorer/testnet/tx/${data.txHash}

═══════════════════════════════
    Thank you!
═══════════════════════════════
  `;
}

export function downloadReceipt(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
