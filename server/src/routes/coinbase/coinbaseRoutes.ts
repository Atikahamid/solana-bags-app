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

    const token = await  generateJWTToken();
    console.log("token from util: ", token);
    const url = 'https://api.cdp.coinbase.com/platform/v2/onramp/sessions';
    const options = {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{"purchaseCurrency":"USDC","destinationNetwork":"base","destinationAddress":"0x71C7656EC7ab88b098defB751B7401B5f6d8976F","paymentAmount":"100.00","paymentCurrency":"USD","paymentMethod":"CARD","country":"US","subdivision":"NY","redirectUrl":"https://yourapp.com/success","clientIp":"8.8.8.8"}'
    };
    try {
        const response = await fetch(url, options);
        console.log("response: ", response);
        const data = await response.json();
        console.log(data);
        return res.json({ data });
    } catch (error) {
        console.error(error);
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