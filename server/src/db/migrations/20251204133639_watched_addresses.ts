import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists('watched_addresses', (t) => {
        t.string('address').primary();
        t.string('username').notNullable();
        t.string('profile_picture_url').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('watched_addresses');
}

