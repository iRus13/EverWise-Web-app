import { build } from 'esbuild';
await build({
  entryPoints: ['server/worker.mjs'],
  outfile: 'dist/server/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2022',
  external: ['node:*'],
});
