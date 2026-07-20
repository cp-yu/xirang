import { promises as fs } from 'node:fs';

export async function atomicWrite(file: string, content: string): Promise<void> {
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, content);
  try { await fs.rename(temporary, file); }
  catch (error) { await fs.rm(temporary, { force: true }); throw error; }
}
