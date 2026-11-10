import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

describe('real completion installer output', () => {
  let home: string;
  beforeEach(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-completion-output-'));
    vi.spyOn(os, 'homedir').mockReturnValue(home);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(home, { recursive: true, force: true });
  });

  it.each(['bash', 'zsh', 'fish', 'powershell'])('keeps %s first/repeated installs and uninstall within the output contract', async shell => {
    const profile = path.join(home, 'profile.ps1');
    const env = { ZSH: '', PROFILE: profile, XDG_CONFIG_HOME: home, XIRANG_NO_AUTO_CONFIG: '' };
    for (const name of ['.bashrc', '.zshrc', 'profile.ps1']) await fs.writeFile(path.join(home, name), '# User configuration\n');
    for (const json of [true, false]) {
      for (let install = 0; install < 2; install++) {
        const result = await runCLI(['completion', 'install', shell, ...(json ? ['--json'] : [])], { env });
        expect(result.exitCode, result.stderr).toBe(0);
        if (shell === 'fish') expect(result.stdout).toBe('');
        else if (json) expect(JSON.parse(result.stdout).instructions).toEqual(expect.arrayContaining([expect.stringMatching(/restart|exec |\$PROFILE/i)]));
        else expect(result.stdout).toMatch(/restart|exec |\$PROFILE/i);
        expect(result.stdout).not.toMatch(/installed|up to date|activate automatically|available immediately/i);
        if (json && result.stderr) for (const line of result.stderr.trim().split('\n')) expect(JSON.parse(line)).toHaveProperty('message');
      }
      const removed = await runCLI(['completion', 'uninstall', shell, '--yes', ...(json ? ['--json'] : [])], { env });
      expect(removed.exitCode, removed.stderr).toBe(0);
      expect(removed.stdout).toBe('');
      if (json && removed.stderr) for (const line of removed.stderr.trim().split('\n')) expect(JSON.parse(line)).toHaveProperty('message');
    }
    for (const name of ['.bashrc', '.zshrc', 'profile.ps1']) expect(await fs.readFile(path.join(home, name), 'utf8')).toContain('# User configuration');
  });
});
