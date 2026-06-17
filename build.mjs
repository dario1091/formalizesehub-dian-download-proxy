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

  // Plugin para resolver imports cross-repo del auth-middleware
  const resolveAuthMiddleware = {
    name: 'resolve-auth-middleware',
    setup(build) {
      build.onResolve({ filter: /formalizesehub-auth\/shared\/auth-middleware/ }, () => ({
        path: resolve(__dirname, '../formalizesehub-auth/shared/auth-middleware/src/index.ts'),
      }));
    },
  };

  await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/index.ts')],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node20',
    outfile: resolve(__dirname, 'dist/index.js'),
    external: ['@aws-sdk/*'],
    sourcemap: true,
    format: 'cjs',
    plugins: [resolveAuthMiddleware],
  });
  console.log('✅ Build completed');

  await execAsync('cd dist && zip -r ../dist.zip . -q', { cwd: __dirname });
  console.log('📦 Package created');
}

build().catch(err => { console.error('❌', err); process.exit(1); });