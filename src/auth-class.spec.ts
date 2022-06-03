import Auth from "./auth-class";
import type DatabaseAdapter from "./DatabaseAdapter";

describe("Auth", () => {
  it("constructor", () => {
    const dba = {};
    const untrusted = { a: 1 };
    // @ts-expect-error: stub
    const auth = new Auth(dba, untrusted);
    expect(auth.dba).toBe(dba);
    expect(auth.untrusted).toBe(untrusted);
  });

  it("sid", async () => {
    const dba = {} as DatabaseAdapter;
    const auth = new Auth(dba, {});
    expect(await auth.sid()).toBe(null);

    auth.untrusted.sid = "sid";
    expect(await auth.sid()).toBe("sid");
  });

  describe("getSessionData", () => {
    it("calls db getSessionData with sid", async () => {
      const dba = { Users: { getSessionData: jest.fn() } };
      // @ts-expect-error: stub
      const auth = new Auth(dba, { sid: "sid" });
      dba.Users.getSessionData.mockReturnValueOnce("session");

      const session = await auth.getSessionData();
      expect(dba.Users.getSessionData).toHaveBeenCalledWith("sid");
      expect(session).toBe("session");
    });

    it("returns {} on falsey sid", async () => {
      const dba = { Users: { getSessionData: jest.fn() } };
      // @ts-expect-error: stub
      const auth = new Auth(dba, {
        /* no sid */
      });
      const session = await auth.getSessionData();
      expect(session).toEqual({});
    });
  });

  describe("setSessionData", () => {
    it("calls db setSessionData with sid", async () => {
      const dba = { Users: { setSessionData: jest.fn() } };
      // @ts-expect-error: stub
      const auth = new Auth(dba, { sid: "sid" });
      dba.Users.setSessionData.mockReturnValueOnce("setSessionResult");

      const data = {};
      const returnValue = await auth.setSessionData(data);
      expect(dba.Users.setSessionData).toHaveBeenCalledWith("sid", data);
      expect(returnValue).toBe("setSessionResult");
    });

    it("returns null on falsey sid", async () => {
      const dba = { Users: { getSessionData: jest.fn() } };
      // @ts-expect-error: stub
      const auth = new Auth(dba, {
        /* no sid */
      });
      const returnValue = await auth.setSessionData({});
      expect(returnValue).toBe(null);
    });
  });

  describe("userId", () => {
    it("calls getSessionData and returns userId", async () => {
      // @ts-expect-error: stub
      const auth = new Auth({}, {});
      auth.getSessionData = () => Promise.resolve({ userId: "userId" });
      expect(await auth.userId()).toBe("userId");
    });
  });
});
