// migrations/create_trade_feed.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("trade_feed", (table) => {
    table.uuid("id").primary();

    // Relations (soft references)
    table.string("user_privy_id").notNullable();
    table.string("token_mint").notNullable();
    table.uuid("transaction_id").notNullable();

    // User snapshot (WHY: username/image may change)
    table.string("username").notNullable();
    table.text("user_image").nullable();

    // Token snapshot
    table.string("token_name").notNullable();
    table.string("token_symbol").notNullable();
    table.text("token_image").nullable();

    // Trade details
    table.enu("trade_type", ["BUY", "SELL"]).notNullable();
    table.decimal("token_qty", 30, 10).notNullable();
    table.decimal("sol_qty", 30, 10).notNullable();

    // Price + market cap snapshots (IMMUTABLE)
    table.decimal("price_usd_at_trade", 18, 8).notNullable();
    table.decimal("market_cap_at_trade", 18, 2).nullable();

    // Live-ish values (worker updated)
    table.decimal("current_market_cap", 18, 2).nullable();
    table.decimal("pnl_usd", 18, 2).nullable();
    table.decimal("pnl_percent", 10, 2).nullable();

    table.timestamp("executed_at").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Feed performance
    table.index(["executed_at"]);
    table.index(["user_privy_id"]);
    table.index(["token_mint"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("trade_feed");
}
