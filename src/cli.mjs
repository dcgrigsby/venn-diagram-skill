export const RENDERER_INFO = Object.freeze({
  name: 'venn-diagram-skill',
  rendererVersion: '0.1.0',
  schemaVersion: 1,
});

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--version') {
    process.stdout.write(`${JSON.stringify(RENDERER_INFO)}\n`);
    return 0;
  }
  process.stderr.write('Usage: render-venn.mjs --version | <spec.json>\n');
  return 1;
}
