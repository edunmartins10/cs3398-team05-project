import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const api = spawn(process.execPath, ['server/index.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
let vite;
let stopping = false;
let apiExited = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true; api.kill('SIGTERM'); vite?.kill('SIGTERM'); process.exitCode = code;
}
api.on('exit', (code) => { apiExited = true; if (!stopping) stop(code ?? 1); });
api.on('error', (error) => { console.error('Could not start the account API:', error); stop(1); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

async function waitForApi() {
  const url = `http://127.0.0.1:${process.env.API_PORT || process.env.PORT || 3001}/api/health`;
  const deadline = Date.now() + 130_000;
  while (!apiExited && Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('The account API did not become ready; Vite was not started.');
}

try {
  await waitForApi();
  if (!stopping) {
    vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
    vite.on('exit', (code) => { if (!stopping) stop(code || 0); });
    vite.on('error', (error) => { console.error('Could not start Vite:', error); stop(1); });
  }
} catch (error) {
  if (!stopping) {
    console.error(error.message);
    stop(1);
  }
}
