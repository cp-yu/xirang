import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export type LikeC4Runner = (args: string[]) => Promise<void>;

export const runLikeC4: LikeC4Runner = async (args) => {
  const bin = fileURLToPath(new URL('../../../node_modules/likec4/bin/likec4.mjs', import.meta.url));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`LikeC4 exited with code ${code}`)));
  });
};
