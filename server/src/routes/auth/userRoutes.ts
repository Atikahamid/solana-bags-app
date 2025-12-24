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
import express, { Request, Response } from "express";
import knex from "../../db/knex"; // import configured knex instance
import { generateReferralCode } from "../../utils/tokenRelatedUtils";

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


userRoutess.post("/syncUser", async (req: Request, res: Response) => {
  const { user, wallet } = req.body;

  if (!user?.id || !wallet?.address) {
    return res.status(400).json({
      success: false,
      message: "Missing required user or wallet data.",
    });
  }

  try {
    let existingUser = await knex("users")
      .where({ privy_id: user.id })
      .first();

    if (!existingUser) {
      const baseUsername = user.linked_accounts?.[0]?.name
        ? user.linked_accounts[0].name.replace(/\s+/g, "").toLowerCase()
        : `user${Math.floor(Math.random() * 100000)}`;

      const username = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
      const referralCode = generateReferralCode(username, user.id);

      const [newUser] = await knex("users")
        .insert({
          privy_id: user.id,
          username,
          referral_code: referralCode,

          display_name: user.linked_accounts?.[0]?.name || null,
          email:
            user.linked_accounts?.find((a: any) => a.type === "google_oauth")
              ?.email || null,

          profile_image_url:
            user.linked_accounts?.[0]?.profile_image_url || null,

          linked_accounts: JSON.stringify(user.linked_accounts || []),
          mfa_methods: JSON.stringify(user.mfa_methods || []),
          primary_oauth_type: user.linked_accounts?.[0]?.type || null,

          primary_wallet_address: wallet.address,
          chain_type: wallet.chain_type || "solana",
        })
        .returning("*");

      existingUser = newUser;
    }

    const existingWallet = await knex("wallets")
      .where({ address: wallet.address })
      .first();

    if (!existingWallet) {
      await knex("wallets").insert({
        user_id: existingUser.privy_id,
        address: wallet.address,
        public_key: wallet.publicKey,
        chain_type: wallet.chain_type || "solana",
      });
    }

    res.json({
      success: true,
      userPrivyId: existingUser.privy_id,
      referralCode: existingUser.referral_code,
      needsReferral: !existingUser.referred_by, // 👈 key line
    });
  } catch (err: any) {
    console.error("[syncUser] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

userRoutess.post(
  "/referral/accept",
  async (req: Request, res: Response): Promise<any> => {
    const { userPrivyId, referralCode } = req.body;

    if (!userPrivyId || !referralCode) {
      return res.status(400).json({
        success: false,
        message: "Missing userPrivyId or referralCode",
      });
    }

    try {
      await knex.transaction(async (trx) => {
        const user = await trx("users")
          .where({ privy_id: userPrivyId })
          .first();

        if (!user) {
          throw new Error("User not found");
        }

        if (user.referred_by) {
          throw new Error("Referral already used");
        }

        const referrer = await trx("users")
          .where({ referral_code: referralCode })
          .first();

        if (!referrer) {
          throw new Error("Invalid referral code");
        }

        if (referrer.privy_id === userPrivyId) {
          throw new Error("Self-referral is not allowed");
        }

        // ✅ NEW: check if referral row already exists
        const existingReferral = await trx("referrals")
          .where({
            referrer_privy_id: referrer.privy_id,
            referee_privy_id: userPrivyId,
          })
          .first();

        if (existingReferral) {
          throw new Error("Referral already used");
        }

        // Update user
        await trx("users")
          .where({ privy_id: userPrivyId })
          .update({
            referred_by: referralCode,
            referral_accepted_at: trx.fn.now(),
          });

        // Insert referral
        await trx("referrals").insert({
          referrer_privy_id: referrer.privy_id,
          referee_privy_id: userPrivyId,
          referral_code: referralCode,
          status: "PENDING",
        });
      });

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[referral/accept] Error:", err);

      return res.status(400).json({
        success: false,
        message: err.message || "Failed to accept referral code",
      });
    }
  }
);


userRoutess.post("/referral/skip", (_, res: Response) => {
  res.json({ success: true });
});

userRoutess.get("/referrals/:userPrivyId", async (req, res) => {
  const { userPrivyId } = req.params;

  try {
    /* ---------------- STATS ---------------- */
    const stats = await knex("referrals")
      .where({ referrer_privy_id: userPrivyId })
      .select(
        knex.raw("count(*)::int as friends_referred"),
        knex.raw("coalesce(sum(reward_usd), 0)::numeric as total_rewards"),
        knex.raw(`
          coalesce(
            sum(reward_usd) filter (
              where created_at >= now() - interval '7 days'
            ),
            0
          )::numeric as earned_last_7d
        `)
      )
      .first();

    /* ---------------- REFERRED USERS LIST ---------------- */
    const referrals = await knex("referrals as r")
      .join("users as u", "u.privy_id", "r.referee_privy_id") // ✅ CORRECT COLUMN
      .where("r.referrer_privy_id", userPrivyId)
      .orderBy("r.created_at", "desc")
      .select(
        "u.username",
        "u.profile_image_url",
        "r.status",
        knex.raw("coalesce(r.reward_usd, 0)::numeric as fees_earned")
      );

    res.json({
      success: true,
      stats: {
        friendsReferred: stats.friends_referred,
        earnedLast7d: stats.earned_last_7d,
        totalRewards: stats.total_rewards,
      },
      referrals,
    });
  } catch (err) {
    console.error("Referral API error:", err);
    res.status(500).json({ success: false });
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

    const wallets = await knex("wallets").where({ user_id: user.privy_id });

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
