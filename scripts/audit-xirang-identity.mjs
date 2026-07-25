import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const activeRoots = [
  'README.md',
  'AGENTS.md',
  'docs',
  'src',
  'test',
  'tests',
  'scripts',
  'schemas',
  '.xirang/architecture',
  '.xirang/specs',
  '.xirang/references',
  '.pi/skills',
  '.pi/agents',
  '.github/workflows/xirang-v2-cross-platform.yml',
  'eslint.config.js',
  'flake.nix',
  'LICENSE',
  'MAINTAINERS.md',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
]
const historicalRoots = [
  '.xirang/changes/archive',
  'CHANGELOG.md',
  'README_OLD.md',
  'context.md',
  'progress.md',
  'research.md',
]
const extensions = new Set(['.c4', '.js', '.json', '.md', '.mjs', '.sh', '.ts', '.tsx', '.yaml', '.yml'])
const stalePatterns = [
  { name: 'legacy-product-identity', pattern: /open[\s_-]?spec/i },
  {
    name: 'legacy-workspace-path',
    pattern: /(?:^|[\s'"`(])xirang\/(?:architecture|bootstrap(?:-history)?|changes|references|specs|config\.yaml)/m,
  },
  {
    name: 'legacy-workspace-join',
    pattern: /path\.(?:join|resolve)\([^)]*['"]xirang['"]\s*,\s*['"](?:architecture|bootstrap(?:-history)?|changes|references|specs|config\.yaml)['"]/,
  },
  { name: 'removed-arch-preview', pattern: /arch preview/ },
]
const self = 'scripts/audit-xirang-identity.mjs'

async function filesUnder(relative) {
  const absolute = path.join(root, relative)
  const entries = await readdir(absolute, { withFileTypes: true }).catch(() => null)
  if (!entries) {
    const info = await stat(absolute).catch(() => null)
    return info?.isFile() && extensions.has(path.extname(relative)) ? [absolute] : []
  }
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'lib') continue
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(child))
    else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(path.join(root, child))
  }
  return files
}

function findStale(relative, text) {
  const findings = []
  for (const stale of stalePatterns) {
    if (stale.pattern.test(relative) || stale.pattern.test(text)) findings.push(`${stale.name}: ${relative}`)
  }
  if (
    (relative === 'src/core/init.ts' || relative === 'src/ui/welcome-screen.ts')
    && /\/xirang:/.test(text)
  ) {
    findings.push(`retired-init-guidance: ${relative}`)
  }
  return findings
}

const activeFiles = (await Promise.all(activeRoots.map(filesUnder))).flat()
const activeFindings = []
for (const file of activeFiles) {
  const relative = path.relative(root, file)
  if (relative === self) continue
  activeFindings.push(...findStale(relative, await readFile(file, 'utf8')))
}

const historicalFiles = (await Promise.all(historicalRoots.map(filesUnder))).flat()
let historicalCount = 0
for (const file of historicalFiles) {
  const relative = path.relative(root, file)
  historicalCount += findStale(relative, await readFile(file, 'utf8')).length
}

console.log(`Scanned ${activeFiles.length} active Xirang files.`)
console.log(`Historical findings (reported, not failed): ${historicalCount}.`)
if (activeFindings.length > 0) {
  console.error(activeFindings.join('\n'))
  process.exitCode = 1
} else {
  console.log('No stale product identity or removed architecture preview references found in active surfaces.')
}
