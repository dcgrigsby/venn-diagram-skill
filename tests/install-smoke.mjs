import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, copyFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const exportedFiles = [
  'SKILL.md',
  'agents/openai.yaml',
  'scripts/render-venn.mjs',
  'vendor/fonts/NotoSans-Regular.ttf',
  'vendor/fonts/NotoSans-Bold.ttf',
  'vendor/fonts/OFL.txt',
  'vendor/resvg/index_bg.wasm',
  'licenses/THIRD_PARTY_NOTICES.md',
  'LICENSE',
];

async function findInstalledSkills(root) {
  const found = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules') continue;
      const child = join(directory, entry.name);
      if (entry.name === 'venn-diagram-skill') {
        try {
          await access(join(child, 'SKILL.md'));
          found.push(child);
        } catch { /* An unrelated directory is not an installation. */ }
      }
      await visit(child);
    }
  }
  await visit(root);
  return found;
}

async function assertNoNodeModules(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    assert.notEqual(entry.name, 'node_modules', `Unexpected node_modules in ${root}`);
    if (entry.isDirectory()) await assertNoNodeModules(join(root, entry.name));
  }
}

const skipNetwork = process.env.VENN_SKIP_INSTALL_SMOKE === '1';
test('clean project-scope Skills CLI install renders from an unrelated directory',
  { skip: skipNetwork ? 'VENN_SKIP_INSTALL_SMOKE=1 explicitly opts out of network tests' : false },
  async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'venn-install-smoke-'));
    try {
      const cleanExport = join(temporaryRoot, 'clean-export');
      const installProject = join(temporaryRoot, 'install-project');
      const renderCwd = join(temporaryRoot, 'unrelated-render-cwd');
      await Promise.all([mkdir(cleanExport), mkdir(installProject), mkdir(renderCwd)]);
      for (const relativePath of exportedFiles) {
        const source = join(projectRoot, relativePath);
        await access(source);
        const destination = join(cleanExport, relativePath);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }
      const install = spawnSync(
        'npx',
        ['--yes', 'skills@1.7.0', 'add', cleanExport, '--copy', '-y', '-a', 'codex'],
        { cwd: installProject, encoding: 'utf8', shell: process.platform === 'win32', timeout: 120_000 },
      );
      assert.equal(install.status, 0, install.stderr || install.stdout || install.error?.message);
      const installed = await findInstalledSkills(installProject);
      assert.equal(installed.length, 1, `Expected one installation, found: ${installed.join(', ')}`);
      const skillRoot = installed[0];
      for (const required of [
        'SKILL.md', 'scripts/render-venn.mjs', 'vendor/fonts/NotoSans-Regular.ttf',
        'vendor/fonts/NotoSans-Bold.ttf', 'vendor/resvg/index_bg.wasm',
      ]) await access(join(skillRoot, required));
      await assertNoNodeModules(skillRoot);

      const outputDirectory = join(renderCwd, 'results');
      const input = join(renderCwd, 'spec.json');
      await writeFile(input, JSON.stringify({
        version: 1,
        sets: [{ id: 'a', label: 'Product' }, { id: 'b', label: 'Engineering' }],
        overlaps: { ab: { text: 'Viable roadmap' } },
        output: { directory: outputDirectory, basename: 'installed-smoke' },
      }));
      const run = spawnSync(process.execPath,
        [resolve(skillRoot, 'scripts/render-venn.mjs'), resolve(input)],
        { cwd: renderCwd, encoding: 'utf8', timeout: 120_000 });
      assert.equal(run.status, 0, run.stderr || run.stdout || run.error?.message);
      const report = JSON.parse(run.stdout.trim());
      assert.equal(report.status, 'ok');
      assert.equal(report.svgPath, join(outputDirectory, 'installed-smoke.svg'));
      assert.equal(report.pngPath, join(outputDirectory, 'installed-smoke.png'));
      assert.match(await readFile(report.svgPath, 'utf8'), /<svg\b/);
      const png = await readFile(report.pngPath);
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(Math.max(png.readUInt32BE(16), png.readUInt32BE(20)), 1600);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
