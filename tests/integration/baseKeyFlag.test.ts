import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "@/app";
import { env } from "@/config/env";
import { db } from "@/config/db";
import { redis } from "@/config/redis";
import { migrate } from "@/db/migrate";

const token = jwt.sign({ sub: "integration-user", role: "admin" }, env.JWT_SECRET);

// Helper: truncate tables and re-seed before each test for isolation
async function resetDb(): Promise<void> {
  await db.query("TRUNCATE TABLE feature_usage_logs, features RESTART IDENTITY CASCADE");
  await db.query(`
    INSERT INTO features (key, display_name, released_to) VALUES
      ('ai_chat', 'AI Assistant', 'premium'),
      ('hd_video', 'High Def Stream', 'all')
    ON CONFLICT (key) DO NOTHING
  `);
  await redis.flushdb();
}

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await Promise.allSettled([db.end(), redis.quit()]);
});

describe("Base key flag routes", () => {
  const uniqueKey = "integration_test_flag";

  beforeEach(async () => {
    // Ensure test isolation across integration cases
    await resetDb();
  });

  it("returns all features", async () => {
    const response = await request(app).get("/api/v1/base-key-flags");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(2);
  });

  it("requires auth for feature creation", async () => {
    const response = await request(app).post("/api/v1/base-key-flags").send({
      key: uniqueKey,
      displayName: "Flag without token",
      releasedTo: "none"
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("creates feature with valid token", async () => {
    const response = await request(app)
      .post("/api/v1/base-key-flags")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: uniqueKey, displayName: "Integration Flag", releasedTo: "none" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.key).toBe(uniqueKey);
    expect(response.body.data.releasedTo).toBe("none");
  });

  it("rejects duplicate feature key", async () => {
    await request(app)
      .post("/api/v1/base-key-flags")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: uniqueKey, displayName: "First", releasedTo: "none" });

    const response = await request(app)
      .post("/api/v1/base-key-flags")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: uniqueKey, displayName: "Duplicate", releasedTo: "none" });

    expect(response.status).toBe(409);
  });

  it("updates release target", async () => {
    await request(app)
      .post("/api/v1/base-key-flags")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: uniqueKey, displayName: "Integration Flag", releasedTo: "none" });

    const response = await request(app)
      .patch(`/api/v1/base-key-flags/${uniqueKey}/release`)
      .set("Authorization", `Bearer ${token}`)
      .send({ releasedTo: "premium" });

    expect(response.status).toBe(200);
    expect(response.body.data.releasedTo).toBe("premium");
  });

  it("returns 404 for unknown feature key", async () => {
    const response = await request(app).get("/api/v1/base-key-flags/does_not_exist");

    expect(response.status).toBe(404);
  });

  it("checks access for free tier as denied on premium feature", async () => {
    const response = await request(app)
      .post("/api/v1/base-key-flags/ai_chat/check")
      .send({ userTier: "free" });

    expect(response.status).toBe(200);
    expect(response.body.data.allowed).toBe(false);
  });

  it("checks access for premium tier as allowed on premium feature", async () => {
    const response = await request(app)
      .post("/api/v1/base-key-flags/ai_chat/check")
      .send({ userTier: "premium" });

    expect(response.status).toBe(200);
    expect(response.body.data.allowed).toBe(true);
  });

  it("returns usage-by-tier analytics after access checks", async () => {
    await request(app).post("/api/v1/base-key-flags/ai_chat/check").send({ userTier: "premium" });

    const response = await request(app).get("/api/v1/base-key-flags/analytics/by-tier");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ featureKey: "ai_chat", userTier: "premium", totalUses: 1 })
      ])
    );
  });

  it("returns last-seen analytics", async () => {
    const response = await request(app).get("/api/v1/base-key-flags/analytics/last-seen");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
