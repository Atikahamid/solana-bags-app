import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
     await knex.schema.createTable('trades', (table) => {
        table.bigIncrements('id').primary();

        table.string('tx_hash').notNullable().unique(); // Unique transaction hash
        table.string('owner').notNullable().index();// Owner of the asset

        table.string('base_mint').notNullable().index();
        table.string('base_symbol');
        table.decimal('base_amount', 36, 12);

        table.string('quote_mint').notNullable().index();
        table.string('quote_symbol');
        table.decimal('quote_amount', 36, 12);

        table.string('side');
        table.decimal('price', 36, 12);

        table.timestamp('block_time', { useTz: true }).index();
        table.string('username');
        table.string('avatar_url');


        table.string('source').defaultTo('birdeye');


       table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
    await knex.schema.alterTable('trades', (table) => {
        table.index(['created_at']);
    });
    
}


export async function down(knex: Knex): Promise<void> {
   await knex.schema.dropTableIfExists('trades');
}


