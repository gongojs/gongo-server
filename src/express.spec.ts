import express from "express";
import type { Response } from "express";
import bodyParser from "body-parser";
import request from "supertest";

import GongoServerless from "./serverless";

// const jsonParser = bodyParser.json();
const textParser = bodyParser.text();

describe("express", () => {
  const gs = new GongoServerless();
  const app = express();
  app.post("/", textParser, gs.expressPost());

  function sendQuery(query: Record<string, unknown>) {
    return (
      request(app)
        .post("/")
        .set("Content-Type", "text/plain; charset=utf-8")
        //.set("Accept", "text/plain")
        .send(gs.ARSON.encode(query))
        .then((response) => {
          response.body = gs.ARSON.decode(response.text);
          return response;
        })
    );
  }

  it("sends HTTP 400 Bad Request on non-arson", async () => {
    gs._supressConsoleErrors = true;
    const response = await request(app).post("/").type("form").send("text");
    expect(response.statusCode).toBe(400);
    gs._supressConsoleErrors = false;
  });

  it("sends HTTP 400 Bad Request on no $gongo in request object", async () => {
    gs._supressConsoleErrors = true;
    const query = { noGongo: true };
    const response = await request(app).post("/").send(gs.ARSON.encode(query));
    expect(response.statusCode).toBe(400);
    gs._supressConsoleErrors = false;
  });

  it("sends error on version mismatch", async () => {
    const query = { $gongo: 1 };
    const response = await sendQuery(query);
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
    const response = await sendQuery(query);
    expect(response.statusCode).toBe(200);
    expect(response.body.$error).not.toBeDefined();
    expect(response.body.calls).toMatchObject([{ $result: 1 }, { $result: 2 }]);
  });
});
