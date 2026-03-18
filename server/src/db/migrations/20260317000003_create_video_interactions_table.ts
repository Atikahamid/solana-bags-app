// File: migrations/xxxx_create_video_interactions_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("video_interactions", (table) => {
    table
      .uuid("id")
      .defaultTo(knex.raw("gen_random_uuid()"))
      .primary();

    // 🔗 References
    table
      .uuid("video_id")
      .notNullable()
      .references("id")
      .inTable("videos")
      .onDelete("CASCADE");

    table
      .string("user_privy_id")
      .notNullable()
      .references("privy_id")
      .inTable("users")
      .onDelete("CASCADE");

    // Interaction type
    table
      .enum("interaction_type", ["like", "comment", "share"])
      .notNullable();

    // Comment content (only for comment type)
    table.text("comment_content").nullable();

    table.timestamps(true, true);

    // Ensure one interaction per user per video per type
    table.unique(["video_id", "user_privy_id", "interaction_type"]);

    // Indexes
    table.index(["video_id"]);
    table.index(["user_privy_id"]);
    table.index(["interaction_type"]);
    table.index(["created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("video_interactions");
}