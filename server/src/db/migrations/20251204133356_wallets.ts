import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wallets", (table) => {
        table.increments("id").primary();

        table.string("user_id")
            .notNullable()
            .references("privy_id")
            .inTable("users")
            .onDelete("CASCADE");

        table.string("address").unique().notNullable();
        table.string("public_key").notNullable();
        table.string("chain_type").defaultTo("solana");
        table.string("chain_id");
        table.string("wallet_client");
        table.string("wallet_client_type");
        table.string("recovery_method");
        table.integer("wallet_index").defaultTo(0);
        table.boolean("delegated").defaultTo(false);
        table.boolean("imported").defaultTo(false);
        table.string("status").defaultTo("connected");
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wallets");
}
