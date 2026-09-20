import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [home, manifest] = process.argv.slice(2);
assert.ok(home && manifest, 'Usage: check-deployment.mjs DESTINATION NUL_SEPARATED_MANIFEST');
const common = ['.gitconfig', '.shell_aliases', '.pi/agent/settings.json', '.pi/agent/models.json',
  '.agents/global/rules.md', '.claude/CLAUDE.md', '.hermes/SOUL.md'];
const windows = ['Documents/PowerShell/Microsoft.PowerShell_profile.ps1',
  'AppData/Roaming/Code/User/settings.json'];
const unix = ['.bashrc', '.zshrc'];
for (const file of [...common, ...(process.platform === 'win32' ? windows : unix)]) {
  assert.ok(existsSync(join(home, file)), `Missing deployed file: ${file}`);
}
for (const file of process.platform === 'win32' ? unix : windows) {
  assert.ok(!existsSync(join(home, file)), `Unexpected platform file: ${file}`);
}
assert.match(readFileSync(join(home, '.gitconfig'), 'utf8'), /name = DotfilesTest/);
const files = readFileSync(manifest, 'utf8').split('\0').filter(Boolean);
assert.ok(files.length > 0, 'The managed-file manifest must not be empty');
for (const file of files.filter((file) => file.endsWith('.json'))) {
  const path = join(home, file);
  try { JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`Invalid deployed JSON: ${path}`, { cause: error }); }
}
console.log('Deployment contents and JSON validated');
