import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("users", (table) => {
        table.string("privy_id").primary(); // PRIMARY KEY (natural)
        table.string("username").unique().notNullable();
        table.string("display_name").nullable();
        table.string("email").nullable();
        table.string("profile_image_url").nullable();

        // table.boolean("has_accepted_terms").defaultTo(false);
        // table.boolean("is_guest").defaultTo(false);
        // table.boolean("is_verified").defaultTo(false);
        table.boolean("is_active").defaultTo(true);

        table.jsonb("linked_accounts").defaultTo("[]");
        table.jsonb("mfa_methods").defaultTo("[]");
        table.string("primary_oauth_type").nullable();

        table.decimal("balance_usd", 18, 2).defaultTo(0);
        table.decimal("pnl_usd", 18, 2).defaultTo(0);
        table.decimal("pnl_percent", 10, 2).defaultTo(0);
        table.decimal("total_volume_usd", 18, 2).defaultTo(0);
        table.decimal("earnings_usd", 18, 2).defaultTo(0);

        table.string("primary_wallet_address").nullable();
        table.string("chain_type").defaultTo("solana");

        table.jsonb("settings").defaultTo("{}");
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("users");
}
