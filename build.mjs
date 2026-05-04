import * as esbuild from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, rm } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('🔨 Building dian-download-proxy...');
  await rm(resolve(__dirname, 'dist'), { recursive: true, force: true });
  await rm(resolve(__dirname, 'dist.zip'), { force: true });
  await mkdir(resolve(__dirname, 'dist'), { recursive: true });

  await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/index.ts')],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node20',
    outfile: resolve(__dirname, 'dist/index.js'),
    external: ['@aws-sdk/*', 'jsonwebtoken'],
    nodePaths: [resolve(__dirname, '../formalizesehub-auth/node_modules')],
    sourcemap: true,
    format: 'cjs',
  });
  console.log('✅ Build completed');

  await execAsync('cd dist && zip -r ../dist.zip . -q', { cwd: __dirname });
  console.log('📦 Package created');
}

build().catch(err => { console.error('❌', err); process.exit(1); });
