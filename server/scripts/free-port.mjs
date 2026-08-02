// Frees the server port before dev/start, so a leftover process from a previous run (a common
// Windows problem when the terminal window is closed instead of Ctrl+C) never causes EADDRINUSE.
// Wired in as `predev`/`prestart` in package.json, so it runs automatically.
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PORT ?? 5000);

function pidsOnPortWindows(p) {
  const pids = new Set();
  let out = '';
  try {
    out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
  } catch {
    return pids;
  }
  for (const line of out.split('\n')) {
    // Match a LISTENING row whose local address ends in :<port> (trailing space guards against :<port>0…).
    if (/LISTENING/i.test(line) && line.includes(`:${p} `)) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && pid !== '0') pids.add(pid);
    }
  }
  return pids;
}

function pidsOnPortUnix(p) {
  try {
    const out = execSync(`lsof -ti tcp:${p} -sTCP:LISTEN`, { encoding: 'utf8' }).trim();
    return new Set(out ? out.split('\n') : []);
  } catch {
    return new Set();
  }
}

const isWindows = process.platform === 'win32';
const pids = isWindows ? pidsOnPortWindows(port) : pidsOnPortUnix(port);

if (pids.size === 0) {
  console.log(`Port ${port} is free.`);
} else {
  for (const pid of pids) {
    try {
      execSync(isWindows ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`Freed port ${port} (stopped stale process PID ${pid}).`);
    } catch {
      console.warn(`Could not stop PID ${pid} on port ${port} — you may need to close it manually.`);
    }
  }
}
