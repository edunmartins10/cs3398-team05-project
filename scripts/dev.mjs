import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const api = spawn(process.execPath, ['server/server.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true; api.kill('SIGTERM'); vite.kill('SIGTERM'); process.exitCode = code;
}
api.on('exit', (code) => { if (!stopping) stop(code || 0); });
vite.on('exit', (code) => { if (!stopping) stop(code || 0); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
