// src/services/jupiterSwapService.ts

import axios from 'axios';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Replace with the actual base URL of Jupiter Swap API you use
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';

export interface QuoteResponse {
  // include necessary fields per Jupiter docs
  amountOut: string;
  minAmountOut: string;
  priceImpactPct: number;
  // and other data...
  routePlan: any;
}
 
export interface SwapInstructionResponse {
  // fields returned by /swap-instructions or /swap endpoint
  swapTransaction: string; // base64 transaction string
  // optionally: setupInstructions, cleanupInstructions, addressLookupTableAddresses, etc.
}

export async function getQuote(): Promise<QuoteResponse> {
  try {
    // ✅ Static values for testing (SOL → TREND)
   const url =
      'https://lite-api.jup.ag/swap/v1/quote?' +
      '&inputMint=So11111111111111111111111111111111111111112' +
      '&outputMint=CWGwQ9EWymsQNLgMhUJGpUT3BLJ2aKaj1PZGVVoBpump' +
      '&amount=1000000&slippageBps=50';
      
    console.log('🌐 Fetching quote from Jupiter...');
    const resp = await axios.get(url);

    if (resp.data.error) {
      throw new Error(`Jupiter quote error: ${resp.data.error}`);
    }

    console.log('✅ Quote response:', resp.data);
    return resp.data as QuoteResponse;
  } catch (err: any) {
    console.error('❌ Failed to fetch quote:', err.message);
    throw new Error(`Failed to fetch quote: ${err.message}`);
  }
}


// export async function getQuote(
//   inputMint: string,
//   outputMint: string,
//   amount: number,
//   slippageBps: number
// ): Promise<QuoteResponse> {
//   try {
//     const url = 'https://lite-api.jup.ag/swap/v1/quote?slippageBps=50&swapMode=ExactIn&restrictIntermediateTokens=true&maxAccounts=64&instructionVersion=V1&inputMint=So11111111111111111111111111111111111111112&outputMint=v7ESxFEMQAwcEfV9zRWza2T6yVmrPZpgpLo9Wk8pump&amount=1';
//     // const url = `${JUPITER_API_BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
//     const resp = await axios.get(url);
//     if (resp.data.error) {
//       throw new Error(`Jupiter quote error: ${resp.data.error}`);
//     }
//     return resp.data as QuoteResponse;
//   } catch (err: any) {
//     throw new Error(`Failed to fetch quote: ${err.message}`);
//   }
// }

// export async function buildSwapTransaction(
//   quoteResponse: QuoteResponse,
//   userPublicKey: PublicKey
// ): Promise<SwapInstructionResponse> {
//   try {
//     const url = `${JUPITER_API_BASE}/swap-instructions`;
//     const body = {
//       quoteResponse,
//       userPublicKey: userPublicKey.toString(),
//       dynamicComputeUnitLimit: true
//     };
//     const resp = await axios.post(url, body, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     if (resp.data.error) {
//       throw new Error(`Jupiter swap build error: ${resp.data.error}`);
//     }
//     return resp.data as SwapInstructionResponse;
//   } catch (err: any) {
//     throw new Error(`Failed to build swap transaction: ${err.message}`);
//   }
// }

// export async function buildSwapTransaction(
//   quoteResponse: QuoteResponse,
//   userPublicKey: PublicKey
// ): Promise<SwapInstructionResponse> {
//   try {
//     console.log("⚙️ Building swap transaction on Jupiter Lite API...");

//     const url = "https://lite-api.jup.ag/swap/v1/swap-instructions";

//     const body = {
//       quoteResponse,
//       userPublicKey: userPublicKey.toString(),
//       // ✅ Optional extras:
//       dynamicComputeUnitLimit: true,
//     //   prioritizationFeeLamports: 0, // optional
//     };

//     console.log("📤 Sending POST request to:", url);

//     const resp = await axios.post(url, body, {
//       headers: { "Content-Type": "application/json" },
//     });

//     if (resp.data.error) {
//       throw new Error(`Jupiter swap build error: ${resp.data.error}`);
//     }

//     console.log("✅ Swap transaction built successfully:", resp.data);
//     return resp.data as SwapInstructionResponse;
//   } catch (err: any) {
//     console.error("❌ Failed to build swap transaction:", err.message);
//     throw new Error(`Failed to build swap transaction: ${err.message}`);
//   }
// }

export async function buildSwapTransaction(
  quoteResponse: QuoteResponse,
  userPublicKey: PublicKey
): Promise<any> {
  try {
    console.log("⚙️ Building swap transaction on Jupiter Lite API...");
    console.log("userpublickkey", userPublicKey );
    // ✅ Use /swap instead of /swap-instructions
    const url = "https://lite-api.jup.ag/swap/v1/swap";

    const body = {
      quoteResponse,
      userPublicKey: userPublicKey.toString(),
    //   wrapAndUnwrapSol: true, // optional, helps handle SOL correctly
      dynamicComputeUnitLimit: true,
    //   dynamicSlippage: true, // optional
    };

    console.log("📤 Sending POST request to:", url);

    const resp = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });

    if (resp.data.error) {
      throw new Error(`Jupiter swap build error: ${resp.data.error}`);
    }

    console.log("✅ Swap transaction built successfully!");
    console.log("🧾 Response:", resp.data);

    // ✅ This contains the base64 transaction you’ll sign next
    // resp.data.swapTransaction = base64 string
    return resp.data;

  } catch (err: any) {
    console.error("❌ Failed to build swap transaction:", err.message);
    throw new Error(`Failed to build swap transaction: ${err.message}`);
  }
}

// export async function sendSwapTransaction(
//   connection: Connection,
//   signedTransactionBase64: string
// ): Promise<string> {
//   try {
//     const txBuffer = Buffer.from(signedTransactionBase64, 'base64');
//     const signature = await connection.sendRawTransaction(txBuffer);
//     await connection.confirmTransaction(signature, 'confirmed');
//     return signature;
//   } catch (err: any) {
//     throw new Error(`Failed to send transaction: ${err.message}`);
//   }
// }

export async function sendSwapTransaction(
  connection: Connection,
  base64Transaction: string,
  isPrivy: () => boolean,
  sendBase64Transaction: (
    base64Tx: string,
    connection: Connection,
    options?: {
      confirmTransaction?: boolean;
      statusCallback?: (status: string) => void;
    },
  ) => Promise<string>,
): Promise<string> {
  try {
    console.log("⚙️ Preparing to sign and send swap transaction via Privy/Wallet...");

    // Get wallet hook

    if (!isPrivy()) {
      throw new Error('Privy wallet is not active — cannot sign transaction.');
    }

    // 🔹 Sign and send the transaction using Privy wallet
    const txSignature = await sendBase64Transaction(base64Transaction, connection, {
      confirmTransaction: true,
      statusCallback: (status) => console.log(`🔹 Transaction status: ${status}`),
    });

    console.log('✅ Swap transaction sent successfully:', txSignature);
    return txSignature;

  } catch (err: any) {
    console.error('❌ Failed to sign/send swap transaction:', err);
    throw new Error(`Failed to send swap transaction: ${err.message}`);
  }
}


// // src/services/JupiterSwapService.ts

// import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";
// import { useWallet } from "@solana/wallet-adapter-react";  // or whatever wallet lib you use
// import JSBI from 'jsbi';
// import {
//   JupiterProvider,
//   useJupiter,
//   RouteInfo,
//   JupiterState
// } from "@jup-ag/react-hook";

// export interface SwapParams {
//   inputMint: PublicKey;
//   outputMint: PublicKey;
//   amount: JSBI;      // amount in smallest units of input token (e.g., lamports or token decimals)
//   slippageBps: number; // e.g., 50 = 0.50%
// }

// export interface SwapResult {
//   signature: TransactionSignature;
//   route: RouteInfo;
// }

// export class JupiterSwapService {
//   private connection: Connection;
//   private userPublicKey: PublicKey;
//   private cluster: "mainnet-beta" | "devnet" | "testnet";

//   constructor(
//     connection: Connection,
//     userPublicKey: PublicKey,
//     cluster: "devnet"
//   ) {
//     this.connection = connection;
//     this.userPublicKey = userPublicKey;
//     this.cluster = cluster;
//   }

//   /**
//    * Provide the React context. Wrap your app (or part of it) in JupiterProvider.
//    * Example usage: <JupiterProvider connection={connection} cluster={cluster} userPublicKey={userPublicKey}>…</>
//    */
//   static ProviderWrapper = JupiterProvider;

//   /**
//    * Hook to be used inside React functional component to access Jupiter.
//    * Returns the jupiter state and methods.
//    */
//   static useJupiterHook = (params: SwapParams): JupiterState => {
//     // NOTE: Must be inside a component wrapped with JupiterProvider.
//     const jupiterState = useJupiter({
//       amount: 1,
//       inputMint: new PublicKey('So11111111111111111111111111111111111111112') ,
//       outputMint:  new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
//       slippageBps: 50,
//       // you can optionally set debounceTime, etc
//     });
//     console.log("jupiter state: ", jupiterState);
//     return jupiterState;
//   };

  

//   /**
//    * Execute swap using selected route index.
//    * Returns the transaction signature on successful send.
//    */
//   async executeSwap(
//     route: RouteInfo
//   ): Promise<SwapResult> {
//     // The react-hook provides exchange() method to execute selected route
//     // But this service method is outside of React hook scope — one approach:
//     //   Use the hook to get jupiter.exchange (in a component) then call this service wrapper.
//     // For simplicity: assume caller passes route & we call a helper inside component.
//     throw new Error("executeSwap: Implementation must call jupiter.exchange inside component context");
//   }
// }



//  useEffect(() => {
//     // handleChecking();
//     signingTransaction();
//   }, []);

//   const signingTransaction = async() => {
//     const signTrans = await sendSwapTransaction(connection, base64String, isPrivy, sendBase64Transaction);
//     console.log("signTransaction: ", signTrans); 
//   }
//   const handleChecking = async () => {
//     try {
//       const getQuoteResponse = await getQuote();
//       console.log('getQuote: ', getQuoteResponse);

//       console.log('starting building swap instruction: ------------------');
//       const buildSwapInstructionResponse = buildSwapTransaction(
//         getQuoteResponse,
//         walletPublicKey,
//       );

//       console.log("buildswapResponse: ", buildSwapInstructionResponse);
//     } catch (error) {
//       console.error('error of quote response: ', error);
//     }
//   };

//    const base64String = 'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADJ2D2N1p8v6s7/3zbtVG+v73vNc93dc8P/mk7qrq+BUL5+h4rVvijIiIZb5a4CZc2If83Rhmaa9lT6jWtU2LAKAgAID90uuyHYL3W3Oi9IvwllhI1/vOASNESIWxUZFmISMyuA4gv2zzAGZ6+jlz317I4bUWQZ8aDYDz01uqn/UvrKtTlGmgqHs+Kygzu1NVzU54tNJi0D/a0jBR4L46rAlyVpUlnYtG4XSp+j9AIyXjqDReoG40qRct06FnFNwTSO89iRdSOIA0dTSXmaqElzIACyDGuAYXcEf8Npu3l8A+I9zHD/iu8YhnWW5saeIHtrhlfhhmTDZ4KMXmjgnZ2vq5+G5g1Qfv7qZl0oyjs3Ovg75gT7Sa2O73zJCLJHHTDeLm5IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs1syAx7ALJMIQIDhDP0iqD8qO5+gZAzwP4funKN/1DKKdn+viNdqVCf7dkv8xQ/iDkGrPOwTmTEPdG5bFDDodCWAMpST3sbfWzLHDlzqgMw0ZA9pgHMm13uPGYrTK0UnaY2gfcoa8yAZxniwrUKIBVyQ7/JZosRUgvFOEPtzbCAtwZbHj0XxFOJ1Sf2sEw81YuGxzGqD9tUm20bwD+ClGBpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAEG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqTCgUuBCIUryrm1BdxWItNG11/gBKugwV86bTinNPReqAgoQCQsAAQ0DAgYEDAAODgcICoQBjFXXsGY2aE8GAAAAUmhyaGhyBgAAAERnZWdleWQAAABodHRwczovL2Fwcmljb3QtbWFpbi1jZW50aXBlZGUtNzAubXlwaW5hdGEuY2xvdWQvaXBmcy9RbVJQZ1BVU0dTNDN5dWJpVG1KSjFmQ2FONE41dExRc2hxNTlKRzhGYUR4SHVvBwIABQwCAAAAQEtMAAAAAAA=';

//   // const getQuoteResponse = getQuote();
//   // console.log('getQuote');
