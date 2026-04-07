import type { Pool } from "pg";
import type Redis from "ioredis";

export type ReleaseTarget = "none" | "premium" | "all";
export type UserTier = "free" | "premium";

export type BaseKeyFeature = {
  id: number;
  key: string;
  displayName: string;
  releasedTo: ReleaseTarget;
  updatedAt: string;
};

export type FeatureUsageLog = {
  id: number;
  featureKey: string;
  userTier: UserTier;
  success: boolean;
  createdAt: string;
};

const CACHE_TTL = 60; // seconds
const CACHE_KEY_ALL = "features:all";
const cacheKeyForFeature = (key: string) => `features:key:${key}`;

export class BaseKeyFlagsRepository {
  constructor(
    private readonly db: Pool,
    private readonly redis: Redis
  ) {}

  async getAllFeatures(): Promise<BaseKeyFeature[]> {
    const cached = await this.redis.get(CACHE_KEY_ALL);
    if (cached) {
      return JSON.parse(cached) as BaseKeyFeature[];
    }

    const { rows } = await this.db.query<{
      id: number;
      key: string;
      display_name: string;
      released_to: ReleaseTarget;
      updated_at: Date;
    }>("SELECT id, key, display_name, released_to, updated_at FROM features ORDER BY id");

    const features = rows.map(this.rowToFeature);
    await this.redis.setex(CACHE_KEY_ALL, CACHE_TTL, JSON.stringify(features));
    return features;
  }

  async getFeatureByKey(key: string): Promise<BaseKeyFeature | undefined> {
    const cached = await this.redis.get(cacheKeyForFeature(key));
    if (cached) {
      return JSON.parse(cached) as BaseKeyFeature;
    }

    const { rows } = await this.db.query<{
      id: number;
      key: string;
      display_name: string;
      released_to: ReleaseTarget;
      updated_at: Date;
    }>("SELECT id, key, display_name, released_to, updated_at FROM features WHERE key = $1", [key]);

    if (rows.length === 0) {
      return undefined;
    }

    const feature = this.rowToFeature(rows[0]);
    await this.redis.setex(cacheKeyForFeature(key), CACHE_TTL, JSON.stringify(feature));
    return feature;
  }

  async createFeature(key: string, displayName: string, releasedTo: ReleaseTarget): Promise<BaseKeyFeature> {
    const { rows } = await this.db.query<{
      id: number;
      key: string;
      display_name: string;
      released_to: ReleaseTarget;
      updated_at: Date;
    }>(
      `INSERT INTO features (key, display_name, released_to)
       VALUES ($1, $2, $3)
       RETURNING id, key, display_name, released_to, updated_at`,
      [key, displayName, releasedTo]
    );

    const feature = this.rowToFeature(rows[0]);
    await this.redis.del(CACHE_KEY_ALL);
    return feature;
  }

  async updateReleaseTarget(key: string, releasedTo: ReleaseTarget): Promise<BaseKeyFeature | undefined> {
    const { rows } = await this.db.query<{
      id: number;
      key: string;
      display_name: string;
      released_to: ReleaseTarget;
      updated_at: Date;
    }>(
      `UPDATE features
       SET released_to = $1, updated_at = NOW()
       WHERE key = $2
       RETURNING id, key, display_name, released_to, updated_at`,
      [releasedTo, key]
    );

    if (rows.length === 0) {
      return undefined;
    }

    const feature = this.rowToFeature(rows[0]);
    await Promise.all([
      this.redis.del(CACHE_KEY_ALL),
      this.redis.del(cacheKeyForFeature(key))
    ]);
    return feature;
  }

  async createUsageLog(featureKey: string, userTier: UserTier, success = true): Promise<FeatureUsageLog> {
    const { rows } = await this.db.query<{
      id: number;
      feature_key: string;
      user_tier: UserTier;
      success: boolean;
      created_at: Date;
    }>(
      `INSERT INTO feature_usage_logs (feature_key, user_tier, success)
       VALUES ($1, $2, $3)
       RETURNING id, feature_key, user_tier, success, created_at`,
      [featureKey, userTier, success]
    );

    return this.rowToUsageLog(rows[0]);
  }

  async getAllUsageLogs(): Promise<FeatureUsageLog[]> {
    const { rows } = await this.db.query<{
      id: number;
      feature_key: string;
      user_tier: UserTier;
      success: boolean;
      created_at: Date;
    }>("SELECT id, feature_key, user_tier, success, created_at FROM feature_usage_logs ORDER BY id");

    return rows.map(this.rowToUsageLog);
  }

  private rowToFeature(row: {
    id: number;
    key: string;
    display_name: string;
    released_to: ReleaseTarget;
    updated_at: Date;
  }): BaseKeyFeature {
    return {
      id: row.id,
      key: row.key,
      displayName: row.display_name,
      releasedTo: row.released_to,
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }

  private rowToUsageLog(row: {
    id: number;
    feature_key: string;
    user_tier: UserTier;
    success: boolean;
    created_at: Date;
  }): FeatureUsageLog {
    return {
      id: row.id,
      featureKey: row.feature_key,
      userTier: row.user_tier,
      success: row.success,
      createdAt: new Date(row.created_at).toISOString()
    };
  }
}
