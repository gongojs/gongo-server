import methods from "./builtinMethods";
import type { MethodProps } from "./serverless";

describe("builtinMethods", () => {
  describe("echo", () => {
    it("returns query", () => {
      const query = { a: 1, b: 2 };
      // @ts-expect-error: stub
      expect(methods.echo(query, {})).toEqual(query);
    });
  });

  describe("loginWithPassword", () => {
    const loginWithPassword = methods.loginWithPassword;

    it("returns null on null user", () => {
      // @ts-expect-error: stub
      const props: MethodProps = { dba: { Users: {} } };

      props.dba.Users.getUserWithEmailAndPassword = () => Promise.resolve(null);
      expect(loginWithPassword({}, props)).resolves.toBe(null);

      /*
      props.dba.Users.getUserWithEmailAndPassword = () =>
        Promise.resolve(false);
      expect(loginWithPassword({}, props)).resolves.toBe(null);

      props.dba.Users.getUserWithEmailAndPassword = () =>
        Promise.resolve(undefined);
      expect(loginWithPassword({}, props)).resolves.toBe(null);
      */
    });

    it("returns userId of real user", async () => {
      const props: MethodProps = {
        dba: {
          // @ts-expect-error: stub
          Users: {
            getUserWithEmailAndPassword: () => Promise.resolve({ _id: "id" }),
          },
        },
        // @ts-expect-error: stub
        req: { headers: {}, socket: {} },
        // @ts-expect-error: stub
        auth: {
          async sid() {
            return null;
          },
        },
      };

      expect(await loginWithPassword({}, props)).toBe("id");
    });

    // for e.g. MongoObjectIDs.
    it("calls userId.toString() if userId is an object", async () => {
      const userId = {
        _id: "id",
        toString() {
          return "id";
        },
      };

      const props: MethodProps = {
        dba: {
          // @ts-expect-error: stub
          Users: {
            getUserWithEmailAndPassword: () => Promise.resolve({ _id: userId }),
          },
        },
        // @ts-expect-error: stub
        req: { headers: {}, socket: {} },
        // @ts-expect-error: stub
        auth: {
          async sid() {
            return null;
          },
        },
      };

      expect(await loginWithPassword({}, props)).toBe("id");
    });

    it("set sessionData with userId, userAgent, ip", async () => {
      const setSessionData = jest.fn();
      const getUserWithEmailAndPassword = () => Promise.resolve({ _id: "id" });
      const dba = {
        Users: { getUserWithEmailAndPassword, setSessionData },
      };

      const auth = {
        sid() {
          return "sid";
        },
      };
      const req = {
        headers: { "user-agent": "user-agent" },
        socket: { remoteAddress: "1.1.1.1" },
      };
      // @ts-expect-error: stub
      const props: MethodProps = { dba, auth, req };

      await loginWithPassword({}, props);

      expect(setSessionData).toHaveBeenCalledWith("sid", {
        ip: req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        userId: "id",
      });
    });

    it("set sessionData with x-forwarded-for ip", async () => {
      const setSessionData = jest.fn();
      const getUserWithEmailAndPassword = () => Promise.resolve({ _id: "id" });
      const dba = {
        Users: { getUserWithEmailAndPassword, setSessionData },
      };

      const auth = {
        sid() {
          return "sid";
        },
      };
      const req = {
        headers: {
          "user-agent": "user-agent",
          ["x-forwarded-for"]: "2.2.2.2,3.3.3.3,4.4.4.4",
        },
        socket: {
          remoteAddress: "1.1.1.1", // should be ignored
        },
      };
      // @ts-expect-error: stub
      const props: MethodProps = { dba, auth, req };

      await loginWithPassword({}, props);

      expect(setSessionData).toHaveBeenCalledWith("sid", {
        ip: "2.2.2.2",
        userAgent: req.headers["user-agent"],
        userId: "id",
      });
    });
  });
});
