import GongoServerless from "./serverless";

class DummyDBA /*implements DatabaseAdapter<DummyDBA>*/ {}

describe("GongoServerless2", () => {
  describe("methods", () => {
    it("throws on duplicate method", () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      gs.method("test", () => null);
      expect(() => gs.method("test", () => null)).toThrow(/already exists/);
    });

    it("throws on missing method", async () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      gs.method("null", () => null);
      // @ts-expect-error: stub
      const result = await gs._methodExec("404", {}, {});
      expect(result).toMatchObject({
        $error: {
          message: /does not exist/,
        },
      });
    });

    it("returns methodfunc result", async () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      gs.method("test", () => "test");
      // @ts-expect-error: stub
      expect(await gs._methodExec("test", {}, {})).toMatchObject({
        $result: "test",
      });
    });

    it("passes query", async () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      // @ts-expect-error: stub
      expect(await gs._methodExec("echo", "test", {})).toMatchObject({
        $result: "test",
      });
    });

    it("handles thrown errors", async () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      gs._supressConsoleErrors = true;
      gs.method("error", () => {
        throw new Error("My Error");
      });
      // @ts-expect-error: stub
      expect(await gs._methodExec("error", {}, {})).toMatchObject({
        $error: {
          message: "My Error",
        },
      });
    });

    it("handles thrown non-errors", async () => {
      // @ts-expect-error: stub
      const gs = new GongoServerless({ dba: DummyDBA });
      gs._supressConsoleErrors = true;
      gs.method("error", () => {
        throw "string error";
      });
      // @ts-expect-error: stub
      expect(await gs._methodExec("error", {}, {})).toMatchObject({
        $error: {
          message: 'Unknown error: "string error"',
        },
      });
    });
  });
});
