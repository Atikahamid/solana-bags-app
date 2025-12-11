import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('onramp_sessions', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.string("user_id")
            .notNullable()
            .references("privy_id")
            .inTable("users")
            .onDelete("CASCADE");
        t.string('asset').notNullable();
        t.decimal('amount', 30, 8).nullable();
        t.string('chain').nullable();
        t.string('session_token').nullable();
        t.string('onramp_url').nullable();
        t.string('status').defaultTo('created');
        t.jsonb('metadata').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('onramp_sessions');
}
