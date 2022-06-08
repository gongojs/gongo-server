import { publish, subscribeMethod } from "./publications";
import type GongoServerless from "./serverless";

import type {
  Publications,
  PublicationFunction,
  PublicationResults,
} from "./publications";

// @ts-expect-error: test stub
const test: {
  _publications: Publications<any>;
  publish: typeof publish;
  subscribeMethod: typeof subscribeMethod;
} = {
  _publications: new Map(),
  publish: publish,
  subscribeMethod: subscribeMethod,
} as unknown as GongoServerless<any>;

describe("publications", () => {
  describe("publish", () => {
    beforeEach(() => test._publications.clear());
    const pubStub: PublicationFunction<any> = async () => ({});

    it("sets a publication", () => {
      test.publish("test", pubStub);
      expect(test._publications.get("test")).toBe(pubStub);
    });

    it("throws on duplicate publication name", () => {
      test.publish("test", pubStub);
      expect(() => test.publish("test", pubStub)).toThrow(/already exists/);
    });
  });

  describe("subscribeMethod", () => {
    beforeEach(() => test._publications.clear());

    it("throws on missing publication", () => {
      return expect(
        // @ts-expect-error: test stub
        test.subscribeMethod({}, { name: "test1", opts: {} }, {})
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

      test.publish("echo", async (db, opts, props) => opts);
      // @ts-expect-error: using props stub from above
      const result = await test.subscribeMethod(
        props.dba,
        { name: "echo", opts: "opts" },
        props
      );
      expect(result).toBe("opts (helped)");
    });
  });
});
