// src/services/custodialWalletService.ts
import express from "express";
import { Connection, sendAndConfirmRawTransaction, Keypair } from "@solana/web3.js";
import {
  createWalletLocal,
  getWallet,
  signTxLocal,
} from "../services/custodialWalletService";

export const custodialRouter = express.Router();

// ----------------------------------------------------
// Bootstrap new wallet (local provider)
// ----------------------------------------------------

custodialRouter.post("/wallets/dev-bootstrap", async (_req, res) => {
  try {
    const kp = Keypair.generate(); // generate here
    // console.log("kp: ", kp, kp.publicKey.toBase58());
    const row = await createWalletLocal(kp);
    res.json({ success: true, wallet: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ----------------------------------------------------
// Get wallet by ID
// ----------------------------------------------------
custodialRouter.get("/wallets/:id", async (req, res) => {
  try {
    const row = await getWallet(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, wallet: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ----------------------------------------------------
// Sign transaction locally
// ----------------------------------------------------
custodialRouter.post("/wallets/:id/signTransaction", async (req, res) => {
  try {
    const { txBase64 } = req.body as { txBase64: string };
    if (!txBase64)
      return res
        .status(400)
        .json({ success: false, error: "txBase64 is required" });

    const wallet = await getWallet(req.params.id);
    if (!wallet)
      return res
        .status(404)
        .json({ success: false, error: "Wallet not found" });

    const signedTxB64 = await signTxLocal(wallet.id, txBase64);
    res.json({ success: true, signedTxBase64: signedTxB64 });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ----------------------------------------------------
// Broadcast raw signed tx to Solana
// ----------------------------------------------------
custodialRouter.post("/sendRaw", async (req, res) => {
  try {
    const { signedTxBase64 } = req.body as { signedTxBase64: string };
    if (!signedTxBase64)
      return res
        .status(400)
        .json({ success: false, error: "signedTxBase64 is required" });

    const connection = new Connection(process.env.RPC_URL as string, "confirmed");
    const sig = await sendAndConfirmRawTransaction(
      connection,
      Buffer.from(signedTxBase64, "base64")
    );

    res.json({ success: true, signature: sig });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});