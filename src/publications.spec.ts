/*
import { publications, publish, subscribeMethod } from "./publications";
import type { PublicationFunction, PublicationResults } from "./publications";

describe("publications", () => {
  describe("publish", () => {
    beforeEach(() => publications.clear());
    const pubStub: PublicationFunction = async () => ({});

    it("sets a publication", () => {
      publish("test", pubStub);
      expect(publications.get("test")).toBe(pubStub);
    });

    it("throws on duplicate publication name", () => {
      publish("test", pubStub);
      expect(() => publish("test", pubStub)).toThrow(/already exists/);
    });
  });

  describe("subscribeMethod", () => {
    beforeEach(() => publications.clear());

    it("throws on missing publication", () => {
      return expect(
        // @ts-expect-error: test stub
        subscribeMethod({ name: "test1", opts: {} }, {})
      ).rejects.toThrow(/No such publication/);
    });

    it("runs a valid publication, and calls publishHelper", async () => {
      const props = {
        dba: {
          // @ts-expect-error: test stub
          publishHelper(result) {
            return result + " (helped)";
          },
        },
      };

      publish("echo", async (db, opts, props) => opts);
      const result = await subscribeMethod(
        // @ts-expect-error: test stub
        props.dba,
        { name: "echo", opts: "opts" },
        props
      );
      expect(result).toBe("opts (helped)");
    });
  });
});
*/
