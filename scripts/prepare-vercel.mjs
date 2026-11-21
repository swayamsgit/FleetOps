import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const destination = resolve('outputs/vercel');
mkdirSync(destination, { recursive: true });
for (const directory of ['app', 'public', 'server']) {
  cpSync(directory, `${destination}/${directory}`, { recursive: true });
}
cpSync('deployment/vercel/route.ts', `${destination}/app/api/[...path]/route.ts`);
cpSync('deployment/vercel/workspace-auth.ts', `${destination}/app/workspace-auth.ts`);
cpSync('deployment/vercel/login.tsx', `${destination}/app/login/page.tsx`);
for (const file of ['app/page.tsx', 'app/[...section]/page.tsx']) {
  const path = `${destination}/${file}`;
  const content = readFileSync(path, 'utf8')
    .replace('<Dashboard', '<Dashboard readOnly')
    .replaceAll('chatgpt-auth', 'workspace-auth')
    .replaceAll('requireChatGPTUser', 'requireWorkspaceUser')
    .replace(/requireWorkspaceUser\([^;]*\)/g, 'requireWorkspaceUser()');
  writeFileSync(path, content);
}
const extra = `${destination}/app/extra-pages.tsx`;
writeFileSync(extra, readFileSync(extra, 'utf8').replace('your ChatGPT account', 'your Vercel account'));
writeFileSync(`${destination}/package.json`, JSON.stringify({
  name: 'fleetops', version: '1.0.0', private: true,
  scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
  dependencies: { next: '16.3.4', react: '19.2.6', 'react-dom': '19.2.6', 'lucide-react': '^1.31.0', 'server-only': '0.0.1' },
  devDependencies: { typescript: '5.9.3', '@types/node': '22.19.19', '@types/react': '19.2.14', '@types/react-dom': '19.2.3' },
}, null, 2));
writeFileSync(`${destination}/tsconfig.json`, JSON.stringify({
  compilerOptions: { target: 'ES2017', lib: ['dom','dom.iterable','esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'react-jsx', plugins: [{name:'next'}] },
  include: ['next-env.d.ts','**/*.ts','**/*.tsx','.next/types/**/*.ts'], exclude: ['node_modules'],
}, null, 2));
writeFileSync(`${destination}/vercel.json`, JSON.stringify({ framework: 'nextjs' }));
console.log(destination);
// Keep standalone builds from inheriting the Sites parent's PostCSS configuration.
writeFileSync(`${destination}/postcss.config.mjs`, 'export default { plugins: {} };\n');
