import type DatabaseAdapter from "./DatabaseAdapter";
import type { DbaUser } from "./DatabaseAdapter";

export default class Auth<
  DBA extends DatabaseAdapter<DBA>,
  DBAU extends DbaUser
> {
  dba: DBA;
  untrusted: Record<string, unknown>;

  constructor(dba: DBA, untrusted?: Record<string, unknown>) {
    this.dba = dba;
    this.untrusted = untrusted || {};
  }

  async sid(): Promise<string | null> {
    // TODO. optionally check IP or other stuff
    if (typeof this.untrusted.sid === "string") return this.untrusted.sid;
    return null;
  }

  async getSessionData() {
    const sid = await this.sid();
    if (!sid) return {};

    return await this.dba.Users.getSessionData(sid);
  }

  async setSessionData(data: Record<string, unknown>) {
    const sid = await this.sid();
    if (!sid) return null;

    return await this.dba.Users.setSessionData(sid, data);
  }

  async userId(): Promise<DBAU["_id"] | null> {
    const data = await this.getSessionData();
    return (
      data &&
      (data.userId as Awaited<ReturnType<DBA["Users"]["createUser"]>>["_id"])
    );
  }
}
