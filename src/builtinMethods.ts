/*
import type { MethodFunction } from "./serverless";
import DatabaseAdapter from "./DatabaseAdapter";
import type { DbaUser } from "./DatabaseAdapter";

const methods: Record<string, MethodFunction> = {
  echo(db, query) {
    return query;
  },

  async loginWithPassword(
    db: DatabaseAdapter,
    { email, password }: { email: string; password: string },
    { req, auth }
  ): Promise<string | null> {
    const user: DbaUser | null = await db.Users.getUserWithEmailAndPassword(
      email,
      password
    );
    if (!user) return null;

    let userId = user._id;
    if (typeof userId === "object") userId = userId.toString();

    let ip;
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (xForwardedFor) {
      if (Array.isArray(xForwardedFor)) ip = xForwardedFor[0].trim();
      else ip = xForwardedFor.split(",")[0].trim();
    } else {
      ip = req.socket.remoteAddress;
    }

    const sid = await auth.sid();
    if (sid) {
      const data = { userId, userAgent: req.headers["user-agent"], ip };
      db.Users.setSessionData(sid, data);
    }

    //return { userId };
    return userId;
  },
};

export default methods;
*/
