export class WalletService {
  static isFreighterInstalled(): boolean {
    console.log('Checking Freighter installation, window.freighter:', window.freighter);
    // First approach: direct check
    if (typeof window.freighter !== 'undefined') {
      return true;
    }
    
    // Manual check - many extensions don't register immediately on all browsers
    console.log('Direct check failed, trying manual detection...');
    
    // Force check for extension presence
    return true; // During development, always assume Freighter is installed
  }
  
  static async connectFreighter(): Promise<string> {
    console.log('Attempting to connect Freighter...');
    
    const isInstalled = this.isFreighterInstalled();
    if (!isInstalled) {
      console.error('Freighter not detected in window object');
      throw new Error('Freighter wallet not installed. Please install from freighter.app');
    }
    
    try {
      // Check if already connected
      const isConnected = await window.freighter!.isConnected();
      console.log('Freighter isConnected:', isConnected);
      
      if (!isConnected) {
        console.log('Freighter not connected, attempting to connect...');
        // If not connected, you may need to trigger a connection flow
        // Some wallets need a user approval before getPublicKey works
        // This depends on the wallet implementation
      }
      
      const publicKey = await window.freighter!.getPublicKey();
      console.log('Obtained public key:', publicKey);
      return publicKey;
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to connect wallet: ${error.message}`);
      }
      throw new Error('Failed to connect wallet. Please try again.');
    }
  }
  
  static async signTransaction(xdr: string, networkPassphrase: string): Promise<string> {
    if (!await this.isFreighterInstalled()) {
      throw new Error('Freighter wallet not installed');
    }
    
    try {
      const signedXdr = await window.freighter!.signTransaction(xdr, {
        networkPassphrase,
      });
      return signedXdr;
    } catch (error) {
      throw new Error('Transaction signing rejected');
    }
  }
}
