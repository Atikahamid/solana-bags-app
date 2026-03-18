// File: migrations/xxxx_create_tokens_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tokens", (table) => {
    table.string("mint_address").primary();

    table.string("name").notNullable();
    table.string("symbol").notNullable();

    table.text("image");
    table.text("uri");
    table.text("description");

    // socials object (WHY: supports dynamic social links)
    table.jsonb("socials").notNullable().defaultTo("{}");

    // FINAL STATE after all alterations
    table.specificType("total_supply", "numeric").nullable();
    table.timestamp("created_on").nullable();

    table.timestamp("last_updated").notNullable().defaultTo(knex.fn.now());

    table.boolean("is_active").notNullable().defaultTo(true);
    table.integer("decimals").notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tokens");
}