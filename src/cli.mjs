import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeSpec, SpecError } from './spec.mjs';

export const RENDERER_INFO = Object.freeze({
  name: 'venn-diagram-skill',
  rendererVersion: '0.1.0',
  schemaVersion: 1,
});

function reportError(error, debugMessage = error.stack ?? String(error)) {
  const detail = error instanceof SpecError
    ? error
    : new SpecError('INPUT_ERROR', '$', 'unable to read specification file');
  process.stdout.write(`${JSON.stringify({
    status: 'error',
    error: { code: detail.code, path: detail.path, message: detail.message },
  })}\n`);
  process.stderr.write(`${debugMessage}\n`);
  return 1;
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--version') {
    process.stdout.write(`${JSON.stringify(RENDERER_INFO)}\n`);
    return 0;
  }
  if (argv.length === 1 && !argv[0].startsWith('-')) {
    const specPath = resolve(argv[0]);
    try {
      const source = await readFile(specPath, 'utf8');
      let raw;
      try {
        raw = JSON.parse(source);
      } catch (error) {
        throw new SpecError('INVALID_JSON', '$', `invalid JSON: ${error.message}`);
      }
      const spec = normalizeSpec(raw, process.cwd());
      process.stdout.write(`${JSON.stringify({
        status: 'validated',
        spec: { ...spec, overlaps: Object.fromEntries(spec.overlaps) },
      })}\n`);
      return 0;
    } catch (error) {
      return reportError(error);
    }
  }
  return reportError(
    new SpecError('INVALID_ARGUMENTS', 'argv', 'expected one specification JSON path or --version'),
    'Usage: render-venn.mjs --version | <spec.json>',
  );
}
