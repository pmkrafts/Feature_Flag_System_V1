import { db } from "@/config/db";

export async function migrate(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS features (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      released_to TEXT NOT NULL CHECK (released_to IN ('none', 'premium', 'all')),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS feature_usage_logs (
      id BIGSERIAL PRIMARY KEY,
      feature_key TEXT NOT NULL,
      user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'premium')),
      success BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO features (key, display_name, released_to)
    VALUES
      ('ai_chat', 'AI Assistant', 'premium'),
      ('hd_video', 'High Def Stream', 'all')
    ON CONFLICT (key) DO NOTHING;
  `);
}
