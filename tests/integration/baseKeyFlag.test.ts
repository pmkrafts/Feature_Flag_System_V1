import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "@/app";
import { env } from "@/config/env";

describe("Base key flag routes", () => {
  const uniqueKey = `flag_${Date.now()}`;
  const token = jwt.sign({ sub: "integration-user", role: "admin" }, env.JWT_SECRET);

  it("returns all features", async () => {
    const response = await request(app).get("/api/v1/base-key-flags");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
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
      .send({
        key: uniqueKey,
        displayName: "Integration Flag",
        releasedTo: "none"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.key).toBe(uniqueKey);
  });

  it("updates release target", async () => {
    const response = await request(app)
      .patch(`/api/v1/base-key-flags/${uniqueKey}/release`)
      .set("Authorization", `Bearer ${token}`)
      .send({ releasedTo: "premium" });

    expect(response.status).toBe(200);
    expect(response.body.data.releasedTo).toBe("premium");
  });

  it("checks access for free tier as denied", async () => {
    const response = await request(app)
      .post(`/api/v1/base-key-flags/${uniqueKey}/check`)
      .send({ userTier: "free" });

    expect(response.status).toBe(200);
    expect(response.body.data.allowed).toBe(false);
  });

  it("checks access for premium tier as allowed", async () => {
    const response = await request(app)
      .post(`/api/v1/base-key-flags/${uniqueKey}/check`)
      .send({ userTier: "premium" });

    expect(response.status).toBe(200);
    expect(response.body.data.allowed).toBe(true);
  });

  it("returns usage-by-tier analytics", async () => {
    const response = await request(app).get("/api/v1/base-key-flags/analytics/by-tier");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
