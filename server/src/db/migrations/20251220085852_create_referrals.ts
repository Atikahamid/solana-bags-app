import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("referrals", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("referrer_privy_id").notNullable();
    table.string("referee_privy_id").notNullable();

    table.string("referral_code").notNullable();

    table
      .enu("status", ["PENDING", "COMPLETED", "REWARDED"])
      .defaultTo("PENDING");

    table.decimal("reward_usd", 18, 2).defaultTo(0);

    table.timestamp("completed_at").nullable();
    table.timestamp("rewarded_at").nullable();

    table.timestamps(true, true);

    table.unique(["referrer_privy_id", "referee_privy_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("referrals");
}
