import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { brokenLinks } from '../scripts/check-links.mjs';

const root = resolve(import.meta.dirname, '../..');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'dotfiles-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function put(path, content, executable = false) {
  writeFileSync(path, content);
  if (executable) chmodSync(path, 0o755);
}
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

for (const failure of [false, true]) {
  test(`hook preserves index/working files when checks ${failure ? 'fail' : 'pass'}`, (t) => {
    const dir = fixture(t);
    git(dir, 'init', '--quiet');
    put(join(dir, '.gitleaks.toml'), readFileSync(join(root, '.gitleaks.toml')));
    put(join(dir, 'tracked'), 'staged\n');
    git(dir, 'add', '.');
    put(join(dir, 'tracked'), 'unstaged\n');
    put(join(dir, 'untracked'), 'local only\n');
    const before = git(dir, 'diff', '--cached', '--binary');
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    put(join(bin, 'make'), `#!/bin/sh\ncd "$2"\ntest "$(head -n 1 tracked)" = staged || exit 91\ntest ! -e untracked || exit 92\nexit ${failure ? 23 : 0}\n`, true);
    const result = spawnSync('bash', [join(root, '.github/scripts/pre-commit')], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
    assert.equal(result.status, failure ? 23 : 0, result.stderr);
    assert.equal(readFileSync(join(dir, 'tracked'), 'utf8'), 'unstaged\n');
    assert.equal(readFileSync(join(dir, 'untracked'), 'utf8'), 'local only\n');
    assert.equal(git(dir, 'diff', '--cached', '--binary'), before);
    assert.equal(git(dir, 'stash', 'list'), '');
  });
}

test('staged README secrets are rejected even if the working file is clean', (t) => {
  const dir = fixture(t);
  git(dir, 'init', '--quiet');
  put(join(dir, '.gitleaks.toml'), readFileSync(join(root, '.gitleaks.toml')));
  // Synthetic credential assembled at runtime, never a real secret.
  put(join(dir, 'README.md'), `password=${'0123456789abcdef'.repeat(3)}\n`);
  git(dir, 'add', '.');
  put(join(dir, 'README.md'), 'clean working copy\n');
  const result = spawnSync('bash', [join(root, '.github/scripts/pre-commit')], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /leaks found/);
  assert.equal(readFileSync(join(dir, 'README.md'), 'utf8'), 'clean working copy\n');
});

test('documentation links resolve from their document, including fragments and encoded spaces', (t) => {
  const dir = fixture(t);
  mkdirSync(join(dir, 'docs'));
  put(join(dir, 'docs', 'target file.md'), '# Target\n');
  const file = join(dir, 'docs', 'README.md');
  put(file, '[ok](target%20file.md#target)\n[bad](missing.md)\n[external](mailto:a@example.invalid)\n[ref]: <target file.md>\n```md\n[example](not-real.md)\n```\n');
  assert.deepEqual(brokenLinks(file, dir), ['missing.md']);
});

for (const workflow of ['validate', 'integration']) {
  test(`${workflow} notifications treat hostile metadata as data`, async () => {
    const yaml = readFileSync(join(root, `.github/workflows/${workflow}.yml`), 'utf8');
    const body = yaml.match(/          script: \|\n([\s\S]+)$/)[1].replace(/^            /gm, '');
    assert.ok(!body.includes('${{'), 'No expression interpolation in JavaScript');
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const notify = new AsyncFunction('process', 'context', 'core', 'fetch', body);
    const title = "Don't execute '; throw new Error('injected'); //";
    const context = { payload: { pull_request: { title, number: 1 } }, ref: `refs/heads/${title}`,
      eventName: 'pull_request', repo: { owner: 'example', repo: 'dotfiles' }, runId: 1 };
    let payload;
    const env = { DISCORD_WEBHOOK: 'https://example.invalid', JOB_RESULTS: JSON.stringify({
      checks: { result: 'success' }, 'upstream-install': { result: 'skipped' },
    }), GITHUB_SERVER_URL: 'https://github.com' };
    const fetch = async (_url, options) => { payload = JSON.parse(options.body); return { ok: true }; };
    await notify({ env }, context, {}, fetch);
    assert.equal(payload.embeds[0].fields[0].value, context.ref);
    if (workflow === 'validate') assert.ok(payload.embeds[0].description.includes(title));
    assert.deepEqual(payload.allowed_mentions, { parse: [] });
    await assert.rejects(notify({ env }, context, {}, async () => ({ ok: false, status: 429 })), /429/);
    await notify({ env: {} }, context, { info() {} }, () => { throw new Error('Unexpected fetch'); });
  });
}

test('failed installer downloads do not report success', (t) => {
  const dir = fixture(t);
  const bash = execFileSync('which', ['bash'], { encoding: 'utf8' }).trim();
  symlinkSync(bash, join(dir, 'bash'));
  put(join(dir, 'curl'), '#!/bin/sh\nexit 22\n', true);
  for (const name of ['opencode', 'starship']) {
    const rendered = execFileSync('chezmoi', ['execute-template', '--config', join(dir, 'chezmoi.toml'),
      '--override-data', '{"package_manager":"apt"}', '--file',
      join(root, `home/run_onchange_install-${name}.sh.tmpl`)], { encoding: 'utf8' });
    const script = join(dir, `${name}.sh`);
    put(script, rendered);
    const result = spawnSync(bash, [script], { encoding: 'utf8', env: { ...process.env, PATH: dir } });
    assert.notEqual(result.status, 0, `${name} masked a failed download`);
  }
});

test('Pi installer fails when prerequisites are missing', (t) => {
  const dir = fixture(t);
  const bash = execFileSync('which', ['bash'], { encoding: 'utf8' }).trim();
  const checked = spawnSync(bash, [join(root, 'home/run_onchange_install-pi.sh.tmpl')], {
    encoding: 'utf8', env: { ...process.env, PATH: dir },
  });
  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /required/);
});
