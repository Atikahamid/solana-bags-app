// import express, { NextFunction, Router } from 'express';
// import  knex  from '../../db/knex';

// const userRouter = Router();


// userRouter.get('/:id', async(req, res) => {
//   const user = await knex('users').where({ id: req.params.id }).first();
//   if (!user) return res.status(404).json({ error: 'User not found' });
//   res.json(user);
// });

// userRouter.put('/:id', async (req, res) => {
//   const { username, handle, profile_picture_url } = req.body;
//   const [updated] = await knex('users')
//     .where({ id: req.params.id })
//     .update({ username, handle, profile_picture_url })
//     .returning('*');
//   res.json(updated);
// });

// userRouter.get('/:id/wallets', async (req, res) => {
//   const wallets = await knex('user_wallets').where({ user_id: req.params.id });
//   res.json(wallets);
// });

// userRouter.post('/:id/wallets', async (req, res) => {
//   const { wallet_address, provider } = req.body;
//   const [wallet] = await knex('user_wallets')
//     .insert({
//       user_id: req.params.id,
//       wallet_address,
//       provider,
//     })
//     .returning('*');
//   res.json(wallet);
// });

// export default userRouter;


// File: backend/routes/authRoutes.js
import express, {Request, Response } from "express";
import knex from "../../db/knex"; // import configured knex instance
// import {PrivyClient} from '@privy-io/node';
// import dotenv from "dotenv";

// dotenv.config();
// console.log("privy app id: ", process.env.PRIVY_APP_ID);
// console.log("privy app secret: ", process.env.PRIVY_APP_SECRET);


// const privy = new PrivyClient({
//   appId: process.env.PRIVY_APP_ID || 'cmgmo11sz019tld0cebj5wc1b',
//   appSecret: process.env.PRIVY_APP_SECRET || '29Y5eGKrAb1jJFQyJtCkVm4Chjn74LDXoJG2U9bdVsZPPrEKBaveApbsqrmwH4kLi984JTtKw5aNj9c6hQW2eQcu',
//   environment: 'staging',

// });
// console.log("privy: ", privy);
const userRoutess = express.Router();

/**
 * POST /api/auth/syncUser
 * Store or update user + wallet info after successful login
 */
userRoutess.post("/syncUser", async (req: Request, res: Response): Promise<any> => {
  const { user, wallet } = req.body;

  if (!user?.id || !wallet?.address) {
    return res.status(400).json({ success: false, message: "Missing required user or wallet data." });
  }

  try {
    // 1️⃣ Check if user exists
    let existingUser = await knex("users").where({ privy_id: user.id }).first();

    if (!existingUser) {
      const username = user.linked_accounts?.[0]?.name
        ? `$${user.linked_accounts[0].name.replace(/\s+/g, "").toUpperCase()}${Math.floor(Math.random() * 1000)}`
        : `user_${Math.floor(Math.random() * 100000)}`;

      const [newUser] = await knex("users")
        .insert({
          privy_id: user.id,
          username,
          display_name: user.linked_accounts?.[0]?.name || null,
          email: user.linked_accounts?.find((a: { type: string; email?: string }) => a.type === "google_oauth")?.email || null,
          profile_image_url: user.linked_accounts?.[0]?.profile_image_url || null,
          has_accepted_terms: user.has_accepted_terms || false,
          is_guest: user.is_guest || false,
          linked_accounts: JSON.stringify(user.linked_accounts || []),
          mfa_methods: JSON.stringify(user.mfa_methods || []),
          primary_oauth_type: user.linked_accounts?.[0]?.type || null,
          primary_wallet_address: wallet.address,
          chain_type: wallet.chain_type || "solana",
        })
        .returning("*");

      existingUser = newUser;
    }

    // 2️⃣ Check if wallet exists
    const existingWallet = await knex("wallets").where({ address: wallet.address }).first();

    if (!existingWallet) {
      await knex("wallets").insert({
        user_id: existingUser.id,
        address: wallet.address,
        public_key: wallet.publicKey,
        chain_type: wallet.chain_type || "solana",
        chain_id: wallet.chain_id || null,
        wallet_client: wallet.wallet_client || "privy",
        wallet_client_type: wallet.wallet_client_type || "privy",
        recovery_method: wallet.recovery_method || null,
        wallet_index: wallet.wallet_index || 0,
        delegated: wallet.delegated || false,
        imported: wallet.imported || false,
        status: wallet.status || "connected",
      });
    }

    res.json({ success: true, userId: existingUser.id });
  } catch (err: any) {
    console.error("[syncUser] Error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});
/**
 * GET /api/auth/user/:privyId
 * Fetch full user info for profile page
 */
userRoutess.get("/user/:privyId", async (req: Request, res: Response): Promise<any> => {
  const { privyId } = req.params;

  try {
    const user = await knex("users").where({ privy_id: privyId }).first();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const wallets = await knex("wallets").where({ user_id: user.id });

    res.json({ success: true, user, wallets });
  } catch (err: any) {
    console.error("[getUserInfo] Error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

/**
 * PUT /api/auth/updateProfile/:privyId
 * Update username and profile picture only
 */
userRoutess.put("/updateProfile/:privyId", async (req: Request, res: Response): Promise<any> => {
  const { privyId } = req.params;
  const { username, profile_image_url } = req.body;

  if (!username && !profile_image_url) {
    return res.status(400).json({ success: false, message: "No fields provided for update." });
  }

  try {
    const [updatedUser] = await knex("users")
      .where({ privy_id: privyId })
      .update({ username, profile_image_url })
      .returning("*");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "Profile updated successfully.", user: updatedUser });
  } catch (err: any) {
    console.error("[updateProfile] Error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});



/**
 * DELETE /api/auth/deleteAccount/:privyId
 * Deletes a user and all linked wallets by Privy ID
 */
userRoutess.delete("/deleteAccount/:privyId", async (req: Request, res: Response): Promise<any> => {
  const { privyId } = req.params;

  if (!privyId) {
    return res.status(400).json({ success: false, message: "Missing privyId parameter." });
  }

  try {
    const user = await knex("users").where({ privy_id: privyId }).first();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // This automatically deletes wallets due to ON DELETE CASCADE
    await knex("users").where({ privy_id: privyId }).del();

    res.json({ success: true, message: "User and linked wallets deleted successfully." });
  } catch (err: any) {
    console.error("[deleteAccount] Error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

// userRoutess.get("/exportWallet", async(req, res) => {
//   try {
//   const {private_key} = await privy.wallets().export('cmh241vn505uajm0d0li65i8r', {});
//   console.log("private key: ", private_key);
//   res.json({success: true, private_key});
// } catch (error) {
//   console.error('Failed to export wallet:', error);
// }
// });

userRoutess.post("/insert-watchedaddresses", async (req: Request, res: Response): Promise<any> => {
  try {
    const { address, username, profile_picture_url } = req.body;

    if (!address || !username) {
      return res.status(400).json({
        error: "Missing required fields: address, username",
      });
    }

    // Upsert based on primary key (address)
    await knex("watched_addresses")
      .insert({
        address,
        username,
        profile_picture_url: profile_picture_url || null,
      })
      .onConflict("address")
      .merge();

    res.json({ success: true });
  } catch (err: any) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default userRoutess;
