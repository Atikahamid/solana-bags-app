// File: migrations/xxxx_create_videos_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("videos", (table) => {
    table
      .uuid("id")
      .defaultTo(knex.raw("gen_random_uuid()"))
      .primary();

    // 🔗 References
    table
      .string("token_mint")
      .notNullable()
      .references("mint_address")
      .inTable("tokens")
      .onDelete("CASCADE");

    table
      .string("user_privy_id")
      .notNullable()
      .references("privy_id")
      .inTable("users")
      .onDelete("CASCADE");

    // Video data
    table.text("video_url").notNullable();
    table.text("thumbnail_url").nullable();
    table.integer("duration_seconds").nullable();
    table.string("title").nullable();
    table.text("description").nullable();

    // Metadata (dimensions, format, etc.)
    table.jsonb("metadata").notNullable().defaultTo("{}");

    // Engagement metrics
    table.integer("views_count").notNullable().defaultTo(0);
    table.integer("likes_count").notNullable().defaultTo(0);
    table.integer("comments_count").notNullable().defaultTo(0);
    table.integer("shares_count").notNullable().defaultTo(0);

    table.timestamps(true, true);

    // Indexes
    table.index(["token_mint"]);
    table.index(["user_privy_id"]);
    table.index(["created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("videos");
}