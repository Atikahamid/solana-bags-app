// src/routes/buyToken.ts
import { Request, Response } from "express";
import knex from "../db/knex";
import Decimal from "decimal.js";
import { getCurrentTokenPriceUsd } from "../utils/tokenRelatedUtils";

const REFERRAL_FEE_PERCENT = new Decimal(0.10); // 10%
const PLATFORM_FEE_PERCENT = new Decimal(0.003); // 0.3% example Jupiter fee


export const buyToken = async (req: Request, res: Response) => {
  try {
    const { userPrivyId, tokenMint, quantity, priceUsd, txHash, executedAt, } = req.body;

    if (
      !userPrivyId ||
      !tokenMint ||
      !quantity ||
      !priceUsd ||
      !txHash ||
      !executedAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const qty = new Decimal(quantity);
    const price = new Decimal(priceUsd);
    const totalUsd = qty.mul(price);

    await knex.transaction(async (trx) => {
      // 1️⃣ Insert BUY transaction
      await trx("transactions").insert({
        user_privy_id: userPrivyId,
        token_mint: tokenMint,
        type: "BUY",
        quantity: qty.toString(),
        price_usd: price.toString(),
        total_usd: totalUsd.toString(),
        tx_hash: txHash,
        executed_at: executedAt,
      });

      // 2️⃣ Token position logic (UNCHANGED)
      const position = await trx("token_positions")
        .where({
          user_privy_id: userPrivyId,
          token_mint: tokenMint,
        })
        .first();

      if (!position) {
        await trx("token_positions").insert({
          user_privy_id: userPrivyId,
          token_mint: tokenMint,
          total_bought_qty: qty.toString(),
          total_bought_usd: totalUsd.toString(),
          remaining_qty: qty.toString(),
          remaining_cost_usd: totalUsd.toString(),
          avg_buy_price: price.toString(),
          realized_pnl_usd: "0",
        });
      } else {
        const newRemainingQty = new Decimal(position.remaining_qty).add(qty);
        const newRemainingCost = new Decimal(position.remaining_cost_usd).add(
          totalUsd
        );
        const avgBuyPrice = newRemainingCost.div(newRemainingQty);

        await trx("token_positions")
          .where({ id: position.id })
          .update({
            total_bought_qty: new Decimal(position.total_bought_qty)
              .add(qty)
              .toString(),
            total_bought_usd: new Decimal(position.total_bought_usd)
              .add(totalUsd)
              .toString(),
            remaining_qty: newRemainingQty.toString(),
            remaining_cost_usd: newRemainingCost.toString(),
            avg_buy_price: avgBuyPrice.toString(),
          });
      }

      // ============================
      // 3️⃣ REFERRAL LOGIC
      // ============================

      // ✅ FIX 1: correct count() usage (object, not array)
      const result = await trx("transactions")
        .where({ user_privy_id: userPrivyId, type: "BUY" })
        .count<{ count: string }>("* as count")
        .first();
      const count = Number(result?.count ?? 0);
      if (Number(count) === 1) {
        const referral = await trx("referrals")
          .where({
            referee_privy_id: userPrivyId,
            status: "PENDING",
          })
          .first();

        if (referral) {
          // 4️⃣ Calculate trading fee
          const platformFeeUsd = totalUsd.mul(PLATFORM_FEE_PERCENT);

          // Referral reward = % of platform fee
          const referralRewardUsd = platformFeeUsd.mul(
            REFERRAL_FEE_PERCENT
          );

          // 5️⃣ Update referral record
          await trx("referrals")
            .where({ id: referral.id })
            .update({
              status: "REWARDED",
              reward_usd: referralRewardUsd.toString(),
              rewarded_at: trx.fn.now(),
            });

          // ✅ FIX 2: increment expects number, not string
          await trx("users")
            .where({ privy_id: referral.referrer_privy_id })
            .increment(
              "earnings_usd",
              referralRewardUsd.toNumber() // ← MODIFIED
            );

          // 7️⃣ Mark referee as rewarded
          await trx("users")
            .where({ privy_id: userPrivyId })
            .update({ referral_rewarded: true });
        }
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[buyToken] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to buy token",
      error: error.message,
    });
  }

};


export const sellToken = async (req: Request, res: Response) => {
  try {
    const {
      userPrivyId,
      tokenMint,
      quantity,
      priceUsd,
      txHash,
      executedAt,
    } = req.body;

    if (
      !userPrivyId ||
      !tokenMint ||
      !quantity ||
      !priceUsd ||
      !txHash ||
      !executedAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const qty = new Decimal(quantity);
    const price = new Decimal(priceUsd);
    const sellValue = qty.mul(price);

    await knex.transaction(async (trx) => {
      const position = await trx("token_positions")
        .where({
          user_privy_id: userPrivyId,
          token_mint: tokenMint,
        })
        .first();

      if (!position) {
        throw new Error("Token position not found");
      }

      if (new Decimal(position.remaining_qty).lt(qty)) {
        throw new Error("Insufficient balance");
      }

      const avgBuyPrice = new Decimal(position.avg_buy_price);
      const costBasis = qty.mul(avgBuyPrice);
      const realizedPnl = sellValue.sub(costBasis);

      // 1️⃣ Record SELL transaction
      await trx("transactions").insert({
        user_privy_id: userPrivyId,
        token_mint: tokenMint,
        type: "SELL",
        quantity: qty.toString(),
        price_usd: price.toString(),
        total_usd: sellValue.toString(),
        cost_basis_usd: costBasis.toString(),
        realized_pnl_usd: realizedPnl.toString(),
        tx_hash: txHash,
        executed_at: executedAt,
      });

      // 2️⃣ Update position
      const newRemainingQty = new Decimal(position.remaining_qty).sub(qty);
      const newRemainingCost = new Decimal(
        position.remaining_cost_usd
      ).sub(costBasis);

      const newAvgBuyPrice = newRemainingQty.gt(0)
        ? newRemainingCost.div(newRemainingQty)
        : new Decimal(0);

      await trx("token_positions")
        .where({ id: position.id })
        .update({
          total_sold_qty: new Decimal(position.total_sold_qty)
            .add(qty)
            .toString(),
          total_sold_usd: new Decimal(position.total_sold_usd)
            .add(sellValue)
            .toString(),
          realized_pnl_usd: new Decimal(position.realized_pnl_usd)
            .add(realizedPnl)
            .toString(),
          remaining_qty: newRemainingQty.toString(),
          remaining_cost_usd: newRemainingCost.toString(),
          avg_buy_price: newAvgBuyPrice.toString(),
        });
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[sellToken] Error:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Failed to sell token",
    });
  }
};


export const getUserPnl = async (req: Request, res: Response) => {
  try {
    const { userPrivyId } = req.params;

    if (!userPrivyId) {
      return res.status(400).json({
        success: false,
        message: "Missing userPrivyId",
      });
    }

    const positions = await knex("token_positions")
      .where({ user_privy_id: userPrivyId });

    let totalRealizedPnl = new Decimal(0);
    let totalUnrealizedPnl = new Decimal(0);
    let totalInvested = new Decimal(0);

    for (const pos of positions) {
      const remainingQty = new Decimal(pos.remaining_qty);
      const remainingCost = new Decimal(pos.remaining_cost_usd);

      totalRealizedPnl = totalRealizedPnl.add(
        new Decimal(pos.realized_pnl_usd)
      );

      totalInvested = totalInvested.add(remainingCost);

      if (remainingQty.gt(0)) {
        const currentPrice = new Decimal(
          await getCurrentTokenPriceUsd(pos.token_mint)
        );
        console.log("current price: ", currentPrice);

        const marketValue = remainingQty.mul(currentPrice);
        const unrealized = marketValue.sub(remainingCost);

        totalUnrealizedPnl = totalUnrealizedPnl.add(unrealized);
      }
    }

    const totalPnl = totalRealizedPnl.add(totalUnrealizedPnl);
    const pnlPercent = totalInvested.gt(0)
      ? totalPnl.div(totalInvested).mul(100)
      : new Decimal(0);

    // 🔥 PERSIST INTO USERS TABLE
    await knex("users")
      .where({ privy_id: userPrivyId })
      .update({
        pnl_usd: totalPnl.toDecimalPlaces(2).toString(),
        pnl_percent: pnlPercent.toDecimalPlaces(2).toString(),
        updated_at: knex.fn.now(),
      });

    return res.json({
      success: true,
      userPrivyId,
      realizedPnl: totalRealizedPnl.toString(),
      unrealizedPnl: totalUnrealizedPnl.toString(),
      totalPnl: totalPnl.toString(),
      pnlPercent: pnlPercent.toString(),
    });
  } catch (err: any) {
    console.error("[getUserPnl] Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate PnL",
      error: err.message,
    });
  }
};
export const getUserPositions = async (req: Request, res: Response) => {
  try {
    const { userPrivyId } = req.params;

    if (!userPrivyId) {
      return res.status(400).json({ success: false, message: "Missing userPrivyId" });
    }

    // 1️⃣ Load all positions with token metadata
    const positions = await knex("token_positions as tp")
      .join("tokens as t", "tp.token_mint", "t.mint_address")
      .where("tp.user_privy_id", userPrivyId)
      .select(
        "tp.*",
        "t.name as token_name",
        "t.symbol",
        "t.image"
      );

    const openPositions: any[] = [];
    const closedPositions: any[] = [];

    for (const pos of positions) {
      const remainingQty = new Decimal(pos.remaining_qty);
      console.log("remaining quantityL ", remainingQty);
      const totalBoughtUsd = new Decimal(pos.total_bought_usd);
      console.log("totalBoughtUsd", totalBoughtUsd);

      const totalSoldUsd = new Decimal(pos.total_sold_usd);
      console.log("totalSoldUsd", totalSoldUsd);

      const realizedPnl = new Decimal(pos.realized_pnl_usd);
      console.log("realizedPnl ", realizedPnl);

      // ---------- OPEN POSITION ----------
      if (remainingQty.gt(0)) {
        const avgBuyPrice = new Decimal(pos.avg_buy_price);
        console.log("avgBuyPrice ", avgBuyPrice);
        const remainingCost = remainingQty.mul(avgBuyPrice);
        console.log("remainingCost ", remainingCost);
        const currentPrice = new Decimal(
          await getCurrentTokenPriceUsd(pos.token_mint)
        );
        console.log("currentPrice ", currentPrice);
        const marketValue = remainingQty.mul(currentPrice);
        console.log("marketValue ", marketValue);
        const unrealizedPnl = marketValue.sub(remainingCost);
        console.log("unrealizedPnl ", unrealizedPnl);
        const totalPnl = realizedPnl.add(unrealizedPnl);
        console.log("totalPnl ", totalPnl);
        const pnlPercent = remainingCost.gt(0)
          ? totalPnl.div(remainingCost).mul(100)
          : new Decimal(0);
        console.log("pnlPercent ", pnlPercent);

        openPositions.push({
          tokenMint: pos.token_mint,
          tokenName: pos.token_name,
          symbol: pos.symbol,
          image: pos.image,
          remainingQty: remainingQty.toString(),
          pnlUsd: totalPnl.toDecimalPlaces(5).toString(),
          pnlPercent: pnlPercent.toDecimalPlaces(5).toString(),
        });

        continue;
      }

      // ---------- CLOSED POSITION ----------
      if (remainingQty.eq(0)) {
        const lastSellTx = await knex("transactions")
          .where({
            user_privy_id: userPrivyId,
            token_mint: pos.token_mint,
            type: "SELL",
          })
          .orderBy("executed_at", "desc")
          .first();

        const pnlPercent = totalBoughtUsd.gt(0)
          ? realizedPnl.div(totalBoughtUsd).mul(100)
          : new Decimal(0);

        closedPositions.push({
          tokenMint: pos.token_mint,
          tokenName: pos.token_name,
          symbol: pos.symbol,
          image: pos.image,
          pnlUsd: realizedPnl.toDecimalPlaces(5).toString(),
          pnlPercent: pnlPercent.toDecimalPlaces(5).toString(),
          closedAt: lastSellTx?.executed_at ?? null,
        });
      }
    }

    return res.json({
      success: true,
      userPrivyId,
      openPositions,
      closedPositions,
    });
  } catch (err: any) {
    console.error("[getUserPositions]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user positions",
      error: err.message,
    });
  }
};
export const getAllUsersPnl = async (_req: Request, res: Response) => {
  try {
    const users = await knex("users").select(
      "privy_id",
      "username",
      "profile_image_url"
    );

    const results: any[] = [];

    for (const user of users) {
      const positions = await knex("token_positions")
        .where({ user_privy_id: user.privy_id });

      let totalRealizedPnl = new Decimal(0);
      let totalUnrealizedPnl = new Decimal(0);
      let totalInvested = new Decimal(0);

      for (const pos of positions) {
        const remainingQty = new Decimal(pos.remaining_qty);
        const remainingCost = new Decimal(pos.remaining_cost_usd);

        totalRealizedPnl = totalRealizedPnl.add(
          new Decimal(pos.realized_pnl_usd)
        );

        totalInvested = totalInvested.add(remainingCost);

        if (remainingQty.gt(0)) {
          const currentPrice = new Decimal(
            await getCurrentTokenPriceUsd(pos.token_mint)
          );
          const marketValue = remainingQty.mul(currentPrice);
          totalUnrealizedPnl = totalUnrealizedPnl.add(
            marketValue.sub(remainingCost)
          );
        }
      }

      const totalPnl = totalRealizedPnl.add(totalUnrealizedPnl);
      const pnlPercent = totalInvested.gt(0)
        ? totalPnl.div(totalInvested).mul(100)
        : new Decimal(0);

      // ✅ FIXED PART (ONLY CHANGE)
      const tokenImages = await knex("transactions")
        .join("tokens", "transactions.token_mint", "tokens.mint_address")
        .where("transactions.user_privy_id", user.privy_id)
        .select("tokens.image")
        .min("transactions.executed_at as first_trade_at")
        .groupBy("tokens.image")
        .orderBy("first_trade_at", "asc")
        .limit(5);

      results.push({
        userPrivyId: user.privy_id,
        username: user.username,
        profileImage: user.profile_image_url,
        totalPnl: totalPnl.toString(),
        pnlPercent: pnlPercent.toString(),
        tokenImages: tokenImages.map((t) => t.image),
      });
    }

    results.sort(
      (a, b) => Number(b.totalPnl) - Number(a.totalPnl)
    );

    return res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err: any) {
    console.error("[getAllUsersPnl]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate users PnL",
      error: err.message,
    });
  }
};

// export const getUsersPnlByTimeMetrics = async (_req: Request, res: Response) => {
//   try {
//     const windows = {
//       '24h': knex.raw(`now() - interval '24 hours'`),
//       '7d': knex.raw(`now() - interval '7 days'`),
//       '30d': knex.raw(`now() - interval '30 days'`)
//     };

//     const users = await knex('users').select(
//       'privy_id',
//       'username',
//       'profile_image_url'
//     );

//     const response: any = {};

//     for (const [label, windowStart] of Object.entries(windows)) {
//       const leaderboard: any[] = [];

//       for (const user of users) {
//         const positions = await knex('transactions')
//           .where('user_privy_id', user.privy_id)
//           .andWhere('created_at', '>=', windowStart)
//           .groupBy('token_mint')
//           .select('token_mint')
//           .sum({
//             bought_qty: knex.raw(`CASE WHEN type = 'BUY' THEN quantity ELSE 0 END`),
//             bought_usd: knex.raw(`CASE WHEN type = 'BUY' THEN total_usd ELSE 0 END`),
//             sold_qty: knex.raw(`CASE WHEN type = 'SELL' THEN quantity ELSE 0 END`),
//             sold_usd: knex.raw(`CASE WHEN type = 'SELL' THEN total_usd ELSE 0 END`),
//             realized_pnl: knex.raw(`
//               CASE WHEN type = 'SELL' THEN realized_pnl_usd ELSE 0 END
//             `)
//           });

//         let totalRealized = new Decimal(0);
//         let totalUnrealized = new Decimal(0);
//         let totalInvested = new Decimal(0);

//         for (const p of positions) {
//           const remainingQty = new Decimal(p.bought_qty).sub(p.sold_qty);
//           const remainingCost = new Decimal(p.bought_usd).sub(p.sold_usd);

//           totalRealized = totalRealized.add(p.realized_pnl || 0);
//           totalInvested = totalInvested.add(remainingCost);

//           if (remainingQty.gt(0)) {
//             const price = new Decimal(await getCurrentTokenPriceUsd(p.token_mint));
//             totalUnrealized = totalUnrealized.add(
//               remainingQty.mul(price).sub(remainingCost)
//             );
//           }
//         }

//         const totalPnl = totalRealized.add(totalUnrealized);
//         const pnlPercent = totalInvested.gt(0)
//           ? totalPnl.div(totalInvested).mul(100)
//           : new Decimal(0);

//         const tokenImages = await knex('transactions')
//           .join('tokens', 'transactions.token_mint', 'tokens.mint_address')
//           .where('transactions.user_privy_id', user.privy_id)
//           .select('tokens.image')
//           .min('transactions.executed_at as first_trade_at')
//           .groupBy('tokens.image')
//           .orderBy('first_trade_at', 'asc')
//           .limit(5);


//         leaderboard.push({
//           userPrivyId: user.privy_id,
//           username: user.username,
//           profileImage: user.profile_image_url,
//           totalPnl: totalPnl.toString(),
//           pnlPercent: pnlPercent.toString(),
//           tokenImages: tokenImages.map(t => t.image)
//         });
//       }

//       leaderboard.sort((a, b) => Number(b.totalPnl) - Number(a.totalPnl));
//       response[label] = leaderboard;
//     }

//     res.json({ success: true, data: response });
//   } catch (e) {
//     res.status(500).json({ success: false, error: e.message });
//   }
// };


export const createPortfolioSnapshot = async (userPrivyId: string) => {
  const user = await knex("users")
    .where({ privy_id: userPrivyId })
    .first();

  const positions = await knex("token_positions")
    .where({ user_privy_id: userPrivyId });

  let unrealized = new Decimal(0);

  for (const pos of positions) {
    if (new Decimal(pos.remaining_qty).lte(0)) continue;

    const price = new Decimal(
      await getCurrentTokenPriceUsd(pos.token_mint)
    );

    const cost = new Decimal(pos.avg_buy_price)
      .mul(pos.remaining_qty);

    unrealized = unrealized.add(
      price.mul(pos.remaining_qty).sub(cost)
    );
  }

  const equity = new Decimal(user.balance_usd)
    .add(unrealized)
    .add(user.pnl_usd);

  await knex("portfolio_snapshots").insert({
    user_privy_id: userPrivyId,
    snapshot_at: new Date(),
    equity_usd: equity.toDecimalPlaces(5).toString(),
    cash_usd: user.balance_usd,
    unrealized_pnl_usd: unrealized.toDecimalPlaces(5).toString(),
    realized_pnl_usd: user.pnl_usd
  });
};


// src/controllers/portfolioController.ts

export const getPortfolioChart = async (req: Request, res: Response) => {
  try {
    const { userPrivyId } = req.params;
    const window = req.query.window as "24h" | "7d" | "30d";

    if (!userPrivyId || !window) {
      return res.status(400).json({
        success: false,
        message: "Missing userPrivyId or window",
      });
    }

    const WINDOW_START: Record<"24h" | "7d" | "30d", any> = {
      "24h": knex.raw(`now() - interval '24 hours'`),
      "7d": knex.raw(`now() - interval '7 days'`),
      "30d": knex.raw(`now() - interval '30 days'`),
    };

    if (!WINDOW_START[window]) {
      return res.status(400).json({
        success: false,
        message: "Invalid window value",
      });
    }

    const rows = await knex("portfolio_snapshots")
      .where("user_privy_id", userPrivyId)
      .andWhere("snapshot_at", ">=", WINDOW_START[window])
      .orderBy("snapshot_at", "asc")
      .select("snapshot_at", "equity_usd");

    return res.json({
      success: true,
      window,
      points: rows.map(r => ({
        timestamp: r.snapshot_at,
        equity: r.equity_usd,
      })),
    });
  } catch (err: any) {
    console.error("[getPortfolioChart] Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio chart",
      error: err.message,
    });
  }
};

