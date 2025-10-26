interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signTransaction: (xdr: string, opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }) => Promise<string>;
  signAuthEntry: (entryXdr: string, opts?: { accountToSign?: string }) => Promise<string>;
}

interface Window {
  freighter?: FreighterAPI;
}
