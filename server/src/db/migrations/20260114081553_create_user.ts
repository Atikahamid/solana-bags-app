// File: migrations/xxxx_create_users_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    // --------------------
    // Identity
    // --------------------
    table.string("privy_id").primary();
    table.string("username").notNullable().unique();
    table.string("display_name").nullable();
    table.string("email").nullable();
    table.string("profile_image_url").nullable();

    // --------------------
    // Auth / Status
    // --------------------
    table.boolean("has_accepted_terms").notNullable().defaultTo(false);
    table.boolean("is_guest").notNullable().defaultTo(false);
    table.boolean("is_verified").notNullable().defaultTo(false);
    table.boolean("is_active").notNullable().defaultTo(true);

    table.jsonb("linked_accounts").notNullable().defaultTo("[]");
    table.jsonb("mfa_methods").notNullable().defaultTo("[]");
    table.string("primary_oauth_type").nullable();

    // --------------------
    // Financials
    // --------------------
    table.decimal("balance_usd", 18, 2).notNullable().defaultTo(0);
    table.decimal("pnl_usd", 18, 2).notNullable().defaultTo(0);
    table.decimal("pnl_percent", 10, 2).notNullable().defaultTo(0);
    table.decimal("total_volume_usd", 18, 2).notNullable().defaultTo(0);
    table.decimal("earnings_usd", 18, 2).notNullable().defaultTo(0);

    // --------------------
    // Wallet
    // --------------------
    table.string("primary_wallet_address").nullable();
    table.string("chain_type").notNullable().defaultTo("solana");

    // --------------------
    // Referral system
    // --------------------
    table.string("referral_code").notNullable().unique();
    table.string("referred_by").nullable();
    table.timestamp("referral_accepted_at").nullable();
    table.boolean("referral_rewarded").notNullable().defaultTo(false);

    // --------------------
    // Misc
    // --------------------
    table.jsonb("settings").notNullable().defaultTo("{}");

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}