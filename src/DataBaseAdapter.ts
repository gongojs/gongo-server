import type { PublicationResults } from "./publications";

interface InstanceWithToStringMethod {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  toString(): string;
}

export interface DbaUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _id: string | InstanceWithToStringMethod;
}

interface DbaUsers {
  setSessionData(sid: string, data: Record<string, unknown>): Promise<void>;
  getSessionData(sid: string): Promise<Record<string, unknown>>;
  getUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<DbaUser | null>;
}

export default interface DataBaseAdapter {
  Users: DbaUsers;
  publishHelper(results: unknown): Promise<PublicationResults>;
}