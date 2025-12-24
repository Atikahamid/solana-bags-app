import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_holders", (table) => {
    table.unique(
      ["token_mint", "holder_address"],
      "uq_token_holders_token_mint_holder_address"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_holders", (table) => {
    table.dropUnique(
      ["token_mint", "holder_address"],
      "uq_token_holders_token_mint_holder_address"
    );
  });
}
