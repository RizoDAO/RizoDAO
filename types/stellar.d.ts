declare module "@stellar/freighter-api" {
  export interface Freighter {
    isConnected(): Promise<{ isConnected: boolean }>;
    isAllowed(): Promise<{ isAllowed: boolean }>;
    requestAccess(): Promise<{ error?: string; address?: string }>;
    getAddress(): Promise<{ error?: string; address?: string }>;
    getNetwork(): Promise<{ network?: string; networkPassphrase?: string; error?: string }>;
    signTransaction(
      transactionXdr: string,
      options?: { networkPassphrase?: string; address?: string }
    ): Promise<{ error?: string; signedTxXdr?: string }>;
  }

  export const freighter: Freighter;
  export default freighter;

  export function isConnected(): Promise<{ isConnected: boolean }>;
  export function isAllowed(): Promise<{ isAllowed: boolean }>;
  export function requestAccess(): Promise<{ error?: string; address?: string }>;
  export function getAddress(): Promise<{ error?: string; address?: string }>;
  export function getNetwork(): Promise<{ network?: string; networkPassphrase?: string; error?: string }>;
  export function signTransaction(
    transactionXdr: string,
    options?: { networkPassphrase?: string; address?: string }
  ): Promise<{ error?: string; signedTxXdr?: string }>;
}