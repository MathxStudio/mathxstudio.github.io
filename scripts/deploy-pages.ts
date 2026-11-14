import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const originUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
  cwd: rootDir,
  encoding: 'utf8',
}).trim();

if (!originUrl) {
  throw new Error('No git remote "origin" configured.');
}

execFileSync('pnpm', ['build'], { cwd: rootDir, stdio: 'inherit' });

// Prevent GitHub Pages Jekyll from ignoring _astro/ directory
writeFileSync(path.join(distDir, '.nojekyll'), '');

const runGitInDist = (args: string[]) =>
  execFileSync('git', args, { cwd: distDir, stdio: 'inherit' });

try {
  runGitInDist(['init', '-q', '-b', 'gh-pages']);
  runGitInDist(['add', '-A']);
  runGitInDist(['commit', '-q', '-m', `deploy: ${new Date().toISOString()}`]);
  runGitInDist(['push', '-f', originUrl, 'HEAD:gh-pages']);
  console.log('\nDeployed dist/ to branch "gh-pages".');
} finally {
  rmSync(path.join(distDir, '.git'), { recursive: true, force: true });
}
