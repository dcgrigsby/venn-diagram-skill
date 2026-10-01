import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('skill frontmatter has a portable name, bounded description, and a body', async () => {
  const source = await readFile(new URL('../SKILL.md', import.meta.url), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(source);
  assert.ok(match, 'SKILL.md must have YAML frontmatter and a body');
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-z][a-z0-9_-]*):\s*(.+)$/.exec(line);
    assert.ok(field, `Invalid frontmatter line: ${line}`);
    assert.equal(fields.has(field[1]), false, `Duplicate key: ${field[1]}`);
    fields.set(field[1], field[2]);
  }
  assert.deepEqual([...fields.keys()].sort(), ['description', 'name']);
  assert.equal(fields.get('name'), 'venn-diagram-skill');
  const description = fields.get('description');
  assert.ok(description.length > 0 && description.length <= 1024);
  assert.ok(match[1].length <= 1024, 'Frontmatter exceeds the portable size limit');
  assert.match(description, /Venn diagrams/);
  assert.ok(match[2].trim().length > 0);
});

test('skill evaluations cover six distinct prompts with the skill-creator contract', async () => {
  const source = await readFile(new URL('../evals/evals.json', import.meta.url), 'utf8');
  const suite = JSON.parse(source);
  assert.equal(suite.skill_name, 'venn-diagram-skill');
  assert.equal(suite.evals.length, 6);
  assert.equal(new Set(suite.evals.map((item) => item.id)).size, 6);
  for (const item of suite.evals) {
    assert.deepEqual(Object.keys(item).sort(),
      ['expectations', 'expected_output', 'files', 'id', 'prompt']);
    assert.ok(Number.isInteger(item.id));
    assert.ok(item.prompt.length > 20 && item.expected_output.length > 20);
    assert.ok(Array.isArray(item.files) && Array.isArray(item.expectations));
    assert.ok(item.expectations.length >= 5);
    assert.ok(item.expectations.every((expectation) => typeof expectation === 'string'
      && expectation.length > 20));
  }
});

test('README documents a project-first public install and the material disclaimers', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

  assert.match(readme, /npx skills add dcgrigsby\/venn-diagram-skill\s*```/);
  assert.match(readme, /project-scoped/i);
  assert.match(readme, /-a claude-code -a gemini-cli -a codex -a zed -a cursor/);
  assert.match(readme, /optional global install/i);
  assert.match(readme, /shell and filesystem access/i);
  assert.match(readme, /save both SVG and PNG files under \.\/output/i);
  assert.match(readme, /AI-inferred wording or relationships/i);
  assert.match(readme, /do not represent quantities/i);
  assert.match(readme, /best effort/i);
  assert.match(readme, /without warranty/i);
  assert.match(readme, /licenses\/THIRD_PARTY_NOTICES\.md/);
});
