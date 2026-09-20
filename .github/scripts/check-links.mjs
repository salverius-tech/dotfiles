import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function brokenLinks(file, root) {
  // Ignore examples inside code fences and inline code. Validate destinations,
  // not heading fragments or external services (which would make CI flaky).
  const text = readFileSync(file, 'utf8')
    .replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '')
    .replace(/`[^`\n]+`/g, '');
  const links = [...text.matchAll(/\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g),
    ...text.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)];
  const broken = [];
  for (const match of links) {
    const url = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
    const destination = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!destination) continue;
    const path = destination.startsWith('/')
      ? resolve(root, `.${destination}`) : resolve(dirname(file), destination);
    if (!existsSync(path)) broken.push(url);
  }
  return broken;
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', '.hermes', 'node_modules', '.tmp', 'test-results'].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = process.cwd();
  let failures = 0;
  const files = markdownFiles(root);
  for (const file of files) {
    for (const link of brokenLinks(file, root)) {
      console.error(`${file.slice(root.length + 1)}: broken link ${link}`);
      failures++;
    }
  }
  console.log(`Checked local link destinations in ${files.length} Markdown files`);
  process.exitCode = failures ? 1 : 0;
}
