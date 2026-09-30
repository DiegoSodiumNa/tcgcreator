// Own the preview process directly: Windows cmd wrappers can leave servers alive.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
const external = process.env.PLAYWRIGHT_BASE_URL;
let server;
let runner;
const stop = () => { runner?.kill(); server?.kill(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
try {
  if (!external) {
    server = spawn(process.execPath, ['scripts/serve-static.mjs'], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    let ready = false;
    server.on('message', message => { if (message === 'ready') ready = true; });
    for (let attempt = 0; attempt < 100; attempt++) {
      await delay(100);
      if (server.exitCode !== null) throw new Error('No se pudo iniciar el servidor de pruebas; comprueba que el puerto 4173 esté libre.');
      if (ready) break;
    }
    if (!ready) throw new Error('El servidor estático no respondió.');
  }
  runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BASE_URL: external ?? 'http://127.0.0.1:4173' },
  });
  const [code] = await once(runner, 'exit'); process.exitCode = code ?? 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { server?.kill(); }
