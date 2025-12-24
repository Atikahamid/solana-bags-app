import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("referral_code").unique().notNullable();
    table.string("referred_by").nullable(); // referral_code
    table.timestamp("referral_accepted_at").nullable();
    table.boolean("referral_rewarded").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("referral_code");
    table.dropColumn("referred_by");
    table.dropColumn("referral_accepted_at");
    table.dropColumn("referral_rewarded");
  });
}
