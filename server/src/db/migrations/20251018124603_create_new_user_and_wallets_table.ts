import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    // USERS TABLE
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary(); // internal DB ID
        table.string('privy_id').unique().notNullable(); // DID from Privy
        table.string('username').unique().notNullable(); // e.g. $HAFIZAATIKA965
        table.string('display_name').nullable(); // visible name
        table.string('email').nullable();
        table.string('profile_image_url').nullable(); // avatar or NFT image URL

        // Account and status flags
        table.boolean('has_accepted_terms').defaultTo(false);
        table.boolean('is_guest').defaultTo(false);
        table.boolean('is_verified').defaultTo(false);
        table.boolean('is_active').defaultTo(true);

        // Authentication and linked accounts
        table.jsonb('linked_accounts').defaultTo('[]');
        table.jsonb('mfa_methods').defaultTo('[]');
        table.string('primary_oauth_type').nullable();

        // Trading stats
        table.decimal('balance_usd', 18, 2).defaultTo(0.0);
        table.decimal('pnl_usd', 18, 2).defaultTo(0.0);
        table.decimal('pnl_percent', 10, 2).defaultTo(0.0);
        table.decimal('total_volume_usd', 18, 2).defaultTo(0.0); // lifetime trading volume
        table.decimal('earnings_usd', 18, 2).defaultTo(0.0); // total realized earnings

        // Wallet references (for quick access to main wallet)
        table.string('primary_wallet_address').nullable();
        table.string('chain_type').defaultTo('solana');

        // App-related metadata
        table.jsonb('settings').defaultTo('{}'); // theme, notifications, etc.
        table.timestamps(true, true); // created_at + updated_at
    });

    // WALLETS TABLE
    await knex.schema.createTable('wallets', (table) => {
        table.increments('id').primary();
        table
            .integer('user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');

        table.string('address').unique().notNullable();
        table.string('public_key').notNullable();
        table.string('chain_type').notNullable().defaultTo('solana');
        table.string('chain_id').nullable();
        table.string('wallet_client').nullable();
        table.string('wallet_client_type').nullable();
        table.string('recovery_method').nullable();
        table.integer('wallet_index').defaultTo(0);
        table.boolean('delegated').defaultTo(false);
        table.boolean('imported').defaultTo(false);
        table.string('status').defaultTo('connected');
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('wallets');
    await knex.schema.dropTableIfExists('users');
}

