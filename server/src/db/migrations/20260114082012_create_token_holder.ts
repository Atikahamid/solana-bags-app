// File: migrations/xxxx_create_token_holders_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_holders", (table) => {
    table.increments("id").primary();

    table
      .string("token_mint")
      .notNullable()
      .references("mint_address")
      .inTable("tokens")
      .onDelete("CASCADE");

    table.string("holder_address").notNullable();

    table.decimal("tokens_holdings", 30, 8).notNullable();
    table.decimal("value_of_tokens_holdings", 30, 8).notNullable();

    table.decimal("holding_percent", 10, 6);

    table.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());

    table.unique(
      ["token_mint", "holder_address"],
      "uq_token_holders_token_mint_holder_address"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_holders");
}