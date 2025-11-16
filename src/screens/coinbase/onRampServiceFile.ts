// src/services/onrampService.ts
// import Config from 'react-native-config'; // optional: for .env usage
import { SERVER_URL } from "@env";
const BASE_URL = SERVER_URL;

export interface OnrampSessionResponse {
  data: {
    session: {
      onrampUrl: string;
    };
  };
}

/**
 * Calls backend to generate Coinbase Onramp session and return the onramp URL.
 */
export const getOnrampUrl = async (
  purchaseCurrency: string,
  destinationNetwork: string,
  destinationAddress: string,
  paymentAmount: string,
  paymentCurrency: string = "USD"
): Promise<string> => {
  try {
    const bodyData = {
      purchaseCurrency,
      destinationNetwork,
      destinationAddress,
      paymentAmount,
      paymentCurrency
    };

    console.log("📤 Sending Onramp body:", bodyData);

    const res = await fetch(`${BASE_URL}/api/coinbaseRoutes/session/onRampUrl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend Error (${res.status}): ${text}`);
    }

    const json = await res.json();
    console.log("📥 Backend Response:", json);
    
    const url = json?.data?.session?.onrampUrl;
    if (!url) throw new Error('No onrampUrl found in response');

    return url;
  } catch (err) {
    console.error('❌ Error fetching onramp URL:', err);
    throw err;
  }
};

