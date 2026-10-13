// Usage: node examples/basic.mjs <gameId> <serverId>
// Sends a code to your in-game mail, then asks you to type it.
import { createInterface } from 'node:readline/promises';
import { createClient, MlbbApiError } from '../src/index.js';

const [roleId, zoneId] = process.argv.slice(2);
if (!roleId || !zoneId) {
  console.error('Usage: node examples/basic.mjs <gameId> <serverId>');
  process.exit(1);
}

const mlbb = createClient();
const rl = createInterface({ input: process.stdin, output: process.stdout });

try {
  await mlbb.sendCode(roleId, zoneId);
  const code = (await rl.question('Code from your in-game mail: ')).trim();
  const session = await mlbb.login(roleId, zoneId, code);

  const profile = await session.profile();
  console.log(`${profile.name} (level ${profile.level}, ${profile.country ?? 'unknown country'})`);

  const friends = await session.friends();
  console.log(`${friends.length} friends`);
} catch (e) {
  console.error(e instanceof MlbbApiError ? `API error ${e.status}: ${e.message}` : e);
  process.exitCode = 1;
} finally {
  rl.close();
}
