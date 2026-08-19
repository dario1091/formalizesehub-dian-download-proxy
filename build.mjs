import * as esbuild from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, rm, cp } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin para resolver imports cross-repo del auth-middleware
const resolveAuthMiddleware = {
  name: 'resolve-auth-middleware',
  setup(build) {
    build.onResolve({ filter: /formalizesehub-auth\/shared\/auth-middleware/ }, () => ({
      path: resolve(__dirname, '../formalizesehub-auth/shared/auth-middleware/src/index.ts'),
    }));
  },
};

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
    sourcemap: true,
    format: 'cjs',
    plugins: [resolveAuthMiddleware],
  });
  console.log('✅ Build completed');
}

async function packageLambda() {
  console.log('📦 Creating deployment package...');
  const distPath = resolve(__dirname, 'dist');
  const rootModules = resolve(__dirname, 'node_modules');

  await mkdir(resolve(distPath, 'node_modules'), { recursive: true });

  // jsonwebtoken y sus dependencias transitivas (igual que los otros repos)
  const runtimeDeps = [
    'jsonwebtoken', 'jws', 'jwa', 'buffer-equal-constant-time',
    'ecdsa-sig-formatter', 'safe-buffer', 'lodash.includes', 'lodash.isboolean',
    'lodash.isinteger', 'lodash.isnumber', 'lodash.isplainobject', 'lodash.isstring',
    'lodash.once', 'ms', 'semver',
  ];

  let copiedCount = 0;
  for (const dep of runtimeDeps) {
    const source = resolve(rootModules, dep);
    const dest = resolve(distPath, 'node_modules', dep);
    if (existsSync(source)) {
      await cp(source, dest, { recursive: true });
      copiedCount++;
    }
  }
  console.log(`  Copied ${copiedCount} dependencies`);

  await execAsync('cd dist && zip -r ../dist.zip . -q', { cwd: __dirname });
  console.log('📦 Package created');
}

async function main() {
  try {
    await build();
    await packageLambda();
    console.log('🚀 Ready for deployment!');
  } catch (error) {
    console.error('❌', error);
    process.exit(1);
  }
}

main();
