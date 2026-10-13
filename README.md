# jaxxy-mlbb

A tiny JavaScript client for the [JaxxyMLBBapi](https://mlbb.bypaxxy.rip). Log a Mobile Legends player in with an in-game code, then read their profile and friends.

- Zero dependencies, works in Node 18+ and in browsers
- Typed (`.d.ts` included)
- Unofficial, not affiliated with or endorsed by Moonton

## Install

This package is not on npm yet. Install it from GitHub:

```bash
npm install github:j1xxyboo/jaxxymlbbapi
```

## Quick start

```js
import { createClient } from 'jaxxy-mlbb';

const mlbb = createClient();

// 1. The player gets a 4-digit code in their in-game mail
await mlbb.sendCode(123456789, 1234); // Game ID, Server ID

// 2. They type the code. Pass it as a string, it can start with 0.
const session = await mlbb.login(123456789, 1234, '5678');

// 3. Read their data
const profile = await session.profile();
console.log(profile.name, profile.level);

const friends = await session.friends();
console.log(friends.length, 'friends');
```

Save `session.token` if you want to skip the login next time:

```js
const session = mlbb.session(savedToken);
```

## API

| Method | Returns |
|---|---|
| `createClient(options?)` | A client |
| `client.sendCode(roleId, zoneId)` | Resolves when the code is sent |
| `client.login(roleId, zoneId, code)` | A `Session` |
| `client.session(token)` | A `Session` from a saved token |
| `session.profile()` | `{ name, avatar, level, rankLevel, historyRankLevel, country, roleId, zoneId }` |
| `session.friends()` | `[{ name, avatar }]` |
| `session.token` | The session token |

Options: `baseUrl` (default `https://mlbb.bypaxxy.rip`), `timeout` in ms (default 15000), `fetch` (custom fetch).

## Errors

Every failure throws an `MlbbApiError` with a readable `message` and an HTTP `status`.

```js
import { MlbbApiError } from 'jaxxy-mlbb';

try {
  await session.profile();
} catch (e) {
  if (e instanceof MlbbApiError && e.status === 401) {
    // token expired: run sendCode + login again
  }
}
```

| Status | Meaning |
|---|---|
| 400 | A field is missing or invalid |
| 401 | Wrong or expired code, or an invalid or expired token |
| 429 | Rate limited, wait a bit and retry |
| 502, 504 | The game service rejected the request or could not be reached |
| 0 | Network error on your side |

## Good to know

- **Treat tokens like passwords.** Keep them on your server or in secure storage, not in public code.
- Each code works once and expires after about 5 minutes. A new `sendCode` cancels the previous code.
- The service is best-effort and can change or go offline without notice.
- Match history is not available.
- Calls are rate limited per IP, so call from your backend rather than from many browsers behind one address.

## Raw HTTP

Prefer no library? Every endpoint is a `POST` with a JSON body at `https://mlbb.bypaxxy.rip/api/<name>`: `send-code`, `login`, `profile`, `friends`. See the [docs site](https://mlbb.bypaxxy.rip) for request and response examples.

## License

MIT. By [j1xxyboo](https://github.com/j1xxyboo/).
