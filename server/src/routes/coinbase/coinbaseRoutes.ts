import express, { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createSession, generateJWTToken, updateSession } from '../../controllers/onRampSessionController';
// import { generateSessionToken } from '../../service/coinbaseClient';


const coinRouter = Router();


// Create a session token + onramp URL
coinRouter.post('/session', async (req, res) => {
    try {
        const { userId, amount, asset = 'USDC', chain = 'solana', returnUrl } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const generateJWTTokenResponse = await generateJWTToken();
        console.log("token response: ", generateJWTTokenResponse);

        const sessionId = uuidv4();
        // console.log("session id: ", sessionId);

        // Persist minimal session
        const sessionRow = await createSession({ id: sessionId, user_id: userId, asset, amount, chain, status: 'created' });
        // console.log("session row: ", sessionRow);

        // Generate signed session token
        const sessionToken = await generateSessionToken({ sessionId, userId, returnUrl, metadata: { amount, asset, chain } });
        // console.log("session token: ", sessionToken);

        // Build Onramp URL: documentation suggests passing sessionToken as query param 'sessionToken'
        const onrampUrl = `https://pay.coinbase.com/onramp?sessionToken=${encodeURIComponent(sessionToken)}`;


        // Save token and URL
        const updateSessionexist = await updateSession(sessionId, { session_token: sessionToken, onramp_url: onrampUrl, status: 'token_created' });
        // console.log("update seesion result: ", updateSessionexist);

        return res.json({ sessionId, sessionToken, onrampUrl });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'internal_error' });
    }
});


coinRouter.post('/session/onRampUrl', async (req, res) => {
  try {
    const {
      purchaseCurrency,
      destinationNetwork,
      destinationAddress,
      paymentAmount,
      paymentCurrency,
      paymentMethod,
      country,
      subdivision,
      redirectUrl,
    } = req.body;

    // Validate important fields
    if (!destinationAddress) {
      return res.status(400).json({ error: "destinationAddress is required" });
    }
    if (!paymentAmount) {
      return res.status(400).json({ error: "paymentAmount is required" });
    }

    // backend-generated fields
    const clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      "0.0.0.0";

    const token = await generateJWTToken();

    const url = "https://api.cdp.coinbase.com/platform/v2/onramp/sessions";

    const body = {
      purchaseCurrency: purchaseCurrency || "SOL",
      destinationNetwork: destinationNetwork || "solana",
      destinationAddress,
      paymentAmount,
      paymentCurrency: paymentCurrency || "USD",
      paymentMethod: paymentMethod || "CARD",
      country: country || "US",
      subdivision: subdivision || "NY",
      redirectUrl: redirectUrl || "solanabagsapp://MainTabs",
      clientIp: '0.0.0.0',
    };

    console.log("📤 Coinbase Onramp Request Body:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("📥 Coinbase Onramp Response:", data);

    if (!response.ok) {
      return res.status(400).json({
        error: "Coinbase API error",
        details: data,
      });
    }

    return res.json({ data });
  } catch (error) {
    console.error("❌ Error creating onramp session:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});



// Webhook receiver (optional)
coinRouter.post('/webhook', async (req, res) => {
    // TODO: verify Coinbase signature header (see docs) and update session status
    // For now, accept and log
    console.log('webhook', req.body);
    res.sendStatus(200);
});


export default coinRouter;