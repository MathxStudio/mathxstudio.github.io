import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm zhihu <path-or-slug>');
  process.exit(1);
}

async function resolveInputFile(input: string): Promise<string> {
  if (existsSync(input)) {
    return path.resolve(input);
  }
  const roots = ['src/content/writing', 'src/content/notes'];
  const exts = ['.mdx', '.md'];
  for (const root of roots) {
    for (const ext of exts) {
      const candidate = path.resolve(root, `${input}${ext}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error(`Could not find article for "${input}"`);
}

async function readSiteUrl(): Promise<string> {
  const configPath = path.resolve('astro.config.mjs');
  if (!existsSync(configPath)) return 'https://example.com';
  const raw = await readFile(configPath, 'utf8');
  const match = raw.match(/site:\s*['"]([^'"]+)['"]/);
  return (match?.[1] ?? 'https://example.com').replace(/\/+$/, '');
}

function parseFrontmatter(raw: string): { title?: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: raw };
  const fm = match[1];
  const titleMatch = fm.match(/^title:\s*(.+)$/m);
  const title = titleMatch?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  return { title, body: raw.slice(match[0].length) };
}

function transformForZhihu(body: string, siteUrl: string, canonicalUrl: string, title?: string): string {
  // Strip top-level MDX import statements if present
  let out = body.replace(/^import\s+.+?from\s+['"][^'"]+['"];?\r?\n/gm, '').trim();

  // Ensure display math blocks have surrounding blank lines for Zhihu Markdown parser
  out = out.replace(/\r?\n?\$\$\r?\n([\s\S]*?)\r?\n\$\$\r?\n?/g, (_m, eq: string) => `\n\n$$\n${eq}\n$$\n\n`);

  // Rewrite markdown image paths to absolute URLs on the site
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => {
    if (/^https?:\/\//i.test(src)) return `![${alt}](${src})`;
    const clean = src.startsWith('/') ? `${siteUrl}${src}` : `${canonicalUrl}/${src.replace(/^\.\//, '')}`;
    return `![${alt}](${clean})`;
  });

  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n').trim();

  const header = title ? `# ${title}\n\n` : '';
  const footer = `\n\n---\n\n> 原文首发于：${canonicalUrl}\n`;
  return `${header}${out}${footer}`;
}

const filePath = await resolveInputFile(arg);
const raw = await readFile(filePath, 'utf8');
const siteUrl = await readSiteUrl();
const { title, body } = parseFrontmatter(raw);

const relFromContent = path.relative(path.resolve('src/content'), filePath);
const parts = relFromContent.split(path.sep);
const section = parts[0] === 'notes' ? 'notes' : 'writing';
const slug = path.basename(filePath).replace(/\.(mdx|md)$/i, '');
const canonicalUrl = `${siteUrl}/${section}/${slug}`;

const output = transformForZhihu(body, siteUrl, canonicalUrl, title);
const outDir = path.resolve('dist/zhihu');
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${slug}.md`);
await writeFile(outPath, output, 'utf8');

console.log(`Exported Zhihu Markdown -> ${path.relative(process.cwd(), outPath)}`);
if (siteUrl === 'https://example.com') {
  console.log('Note: update "site" in astro.config.mjs before publishing so image/source URLs use your live domain.');
}
