import { rm } from 'node:fs/promises'
import path from 'node:path'

export default async function cleanupGeneratedCache(): Promise<void> {
  await rm(path.join(process.cwd(), 'test', 'fixtures', 'contract-browser', '.xirang', '.cache-likec4'), {
    recursive: true,
    force: true,
  })
}
