const DEFAULT_BASE_URL = 'https://mlbb.bypaxxy.rip';

/** Thrown for every failed request. `status` is the HTTP status, 0 for network errors. */
export class MlbbApiError extends Error {
  constructor(message, status, upstreamCode) {
    super(message);
    this.name = 'MlbbApiError';
    this.status = status;
    this.upstreamCode = upstreamCode;
  }
}

/** A logged-in player. Create one with `client.login()` or `client.session(token)`. */
export class Session {
  #client;
  #token;

  constructor(client, token) {
    this.#client = client;
    this.#token = token;
  }

  /** The session token. Treat it like a password. */
  get token() {
    return this.#token;
  }

  profile() {
    return this.#client.profile(this.#token);
  }

  friends() {
    return this.#client.friends(this.#token);
  }
}

export class MlbbClient {
  #baseUrl;
  #timeout;
  #fetch;

  /**
   * @param {{ baseUrl?: string, timeout?: number, fetch?: typeof fetch }} [options]
   */
  constructor(options = {}) {
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.#timeout = options.timeout ?? 15000;
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.#fetch !== 'function') {
      throw new Error('No fetch available. Use Node 18+ or pass options.fetch.');
    }
  }

  async #post(path, body) {
    let res;
    try {
      res = await this.#fetch(`${this.#baseUrl}/api/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.#timeout),
      });
    } catch (cause) {
      throw new MlbbApiError(`Network error: ${cause?.message ?? cause}`, 0);
    }
    const json = await res.json().catch(() => null);
    if (!json || json.success !== true) {
      throw new MlbbApiError(json?.error ?? `Request failed (${res.status})`, res.status, json?.upstreamCode);
    }
    return json.data;
  }

  /** Sends a 4-digit code to the player's in-game mail. */
  async sendCode(roleId, zoneId) {
    await this.#post('send-code', { roleId: Number(roleId), zoneId: Number(zoneId) });
  }

  /**
   * Exchanges the in-game code for a session. Pass the code as a string, it can start with 0.
   * @returns {Promise<Session>}
   */
  async login(roleId, zoneId, code) {
    const data = await this.#post('login', { roleId: Number(roleId), zoneId: Number(zoneId), vc: String(code) });
    return new Session(this, data.token);
  }

  /** Restores a session from a token you saved earlier. */
  session(token) {
    return new Session(this, token);
  }

  profile(token) {
    return this.#post('profile', { token });
  }

  async friends(token) {
    const data = await this.#post('friends', { token });
    return data.friends;
  }
}

/** Shortcut: `createClient()` is `new MlbbClient()`. */
export const createClient = (options) => new MlbbClient(options);
