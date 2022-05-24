import GongoServerless from "./serverless";

describe("GongoServerless2", () => {
  describe("methods", () => {
    it("throws on duplicate method", () => {
      const gs = new GongoServerless();
      gs.method("test", () => null);
      expect(() => gs.method("test", () => null)).toThrow(/already exists/);
    });

    it("throws on missing method", () => {
      const gs = new GongoServerless();
      gs.method("null", () => null);
      // @ts-expect-error: stub
      expect(gs._methodExec("404", {}, {})).rejects.toThrow(/does not exist/);
    });

    it("returns methodfunc result", async () => {
      const gs = new GongoServerless();
      gs.method("test", () => "test");
      // @ts-expect-error: stub
      expect(await gs._methodExec("test", {}, {})).toMatchObject({
        $result: "test",
      });
    });

    it("passes query", async () => {
      const gs = new GongoServerless();
      // @ts-expect-error: stub
      expect(await gs._methodExec("echo", "test", {})).toMatchObject({
        $result: "test",
      });
    });

    it("handles thrown errors", async () => {
      const gs = new GongoServerless();
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
      const gs = new GongoServerless();
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
