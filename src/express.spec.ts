import express from "express";
import bodyParser from "body-parser";
import request from "supertest";

import GongoServerless from "./serverless";

const jsonParser = bodyParser.json();

describe("express", () => {
  const gs = new GongoServerless();
  const app = express();
  app.post("/", jsonParser, gs.expressPost());

  it("sends HTTP 400 Bad Request on non-json", async () => {
    const response = await request(app).post("/").type("form").send("text");
    expect(response.statusCode).toBe(400);
  });

  it("sends HTTP 400 Bad Request on no $gongo in request object", async () => {
    const query = {};
    const response = await request(app).post("/").send(query);
    expect(response.statusCode).toBe(400);
  });

  it("sends error on version mismatch", async () => {
    const query = { $gongo: 1 };
    const response = await request(app)
      .post("/")
      .set("Accept", "application/json")
      .send(query);
    expect(response.statusCode).toBe(200);
    expect(response.body.$error).toBeDefined();
    expect(response.body.$error.message).toMatch(/^Unsupported API version/);
  });

  it("runs methods", async () => {
    const query = {
      $gongo: 2,
      calls: [
        ["echo", 1],
        ["echo", 2],
      ],
    };
    const response = await request(app).post("/").send(query);
    expect(response.statusCode).toBe(200);
    expect(response.body.$error).not.toBeDefined();
    expect(response.body.calls).toMatchObject([{ $result: 1 }, { $result: 2 }]);
  });
});
