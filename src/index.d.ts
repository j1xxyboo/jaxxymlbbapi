export interface ClientOptions {
  /** Defaults to https://mlbb.bypaxxy.rip */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default 15000. */
  timeout?: number;
  /** Custom fetch implementation (for Node < 18 or tests). */
  fetch?: typeof fetch;
}

export interface Profile {
  name: string;
  avatar: string | null;
  level: number;
  rankLevel: number;
  historyRankLevel: number;
  country: string | null;
  roleId: number;
  zoneId: number;
}

export interface Friend {
  name: string;
  avatar: string | null;
}

export class MlbbApiError extends Error {
  /** HTTP status, or 0 for a network error. */
  status: number;
  upstreamCode?: number;
}

export class Session {
  /** The session token. Treat it like a password. */
  readonly token: string;
  profile(): Promise<Profile>;
  friends(): Promise<Friend[]>;
}

export class MlbbClient {
  constructor(options?: ClientOptions);
  sendCode(roleId: number | string, zoneId: number | string): Promise<void>;
  login(roleId: number | string, zoneId: number | string, code: string | number): Promise<Session>;
  session(token: string): Session;
  profile(token: string): Promise<Profile>;
  friends(token: string): Promise<Friend[]>;
}

export function createClient(options?: ClientOptions): MlbbClient;
