import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    // watched addresses table
    await knex.schema.createTableIfNotExists('watched_addresses', (t) => {
        t.string('address').primary();
        t.string('username').notNullable();
        t.string('profile_picture_url').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // processed signature dedupe table
    await knex.schema.createTableIfNotExists('processed_signatures', (t) => {
        t.string('signature').primary();
        t.timestamp('seen_at').defaultTo(knex.fn.now());
    });

    // normalized swaps
    await knex.schema.createTableIfNotExists('swaps', (t) => {
        t.increments('id').primary();
        t.string('signature').unique().notNullable();
        t.bigInteger('slot').nullable();
        t.integer('block_time').nullable(); // epoch seconds
        t.string('wallet').nullable(); // watched address which triggered this
        t.string('in_mint').nullable();
        t.decimal('in_amount', 40, 12).nullable();
        t.string('out_mint').nullable();
        t.decimal('out_amount', 40, 12).nullable();
        t.string('program_id').nullable();
        t.jsonb('raw').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('swaps');
    await knex.schema.dropTableIfExists('processed_signatures');
    await knex.schema.dropTableIfExists('watched_addresses');
}

