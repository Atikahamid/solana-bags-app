// ==== File: server/src/db/migrations/20250917_add_uri_to_discovery_tokens.ts ====
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.text("uri").nullable(); // Add new column for token metadata URI
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.dropColumn("uri"); // Rollback safely
  });
}
