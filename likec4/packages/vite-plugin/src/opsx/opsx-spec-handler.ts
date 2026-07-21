import { promises as fs } from 'node:fs'
import path from 'node:path'

const OPSX_SPECS_PREFIX = '.opsx/specs/'

export interface OpsxSpecIndex {
  getIndexedSpecs(element: string): Promise<readonly string[] | undefined>
}

export interface OpsxSpecResult {
  path: string
  md: string
}

export interface OpsxSpecChangedEvent {
  path: string
}

export class OpsxSpecError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export async function getProjectIndexedSpecs<P extends { id: string }>({
  project,
  element,
  projects,
  loadModel,
}: {
  project: string
  element: string
  projects: readonly P[]
  loadModel(project: P): Promise<{
    findElement(element: string): { metadata?: unknown } | null | undefined
  }>
}): Promise<readonly string[] | undefined> {
  const selected = projects.find(candidate => candidate.id === project)
  if (!selected) {
    return undefined
  }
  const metadata = (await loadModel(selected)).findElement(element)?.metadata
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }
  const specs = (metadata as Record<string, unknown>)['specs']
  if (Array.isArray(specs)) {
    return specs.filter((entry): entry is string => typeof entry === 'string')
  }
  return typeof specs === 'string' ? [specs] : undefined
}

export async function readOpsxSpec({
  projectRoot,
  element,
  specPath,
  index,
}: {
  projectRoot: string
  element: string
  specPath: string
  index: OpsxSpecIndex
}): Promise<OpsxSpecResult> {
  validateSpecPath(specPath)

  const indexedSpecs = await index.getIndexedSpecs(element)
  if (!indexedSpecs) {
    throw new OpsxSpecError(404, 'Element not found')
  }
  if (!indexedSpecs.includes(specPath)) {
    throw new OpsxSpecError(403, 'Spec is not indexed by this element')
  }

  const specsRoot = path.join(projectRoot, '.opsx', 'specs')
  const target = path.resolve(projectRoot, ...specPath.split('/'))
  let realSpecsRoot: string
  let realTarget: string
  try {
    ;[realSpecsRoot, realTarget] = await Promise.all([
      fs.realpath(specsRoot),
      fs.realpath(target),
    ])
  } catch {
    throw new OpsxSpecError(404, 'Spec not found')
  }

  if (!isPathInside(realSpecsRoot, realTarget)) {
    throw new OpsxSpecError(403, 'Spec path escapes the Specs directory')
  }

  try {
    return {
      path: specPath,
      md: await fs.readFile(realTarget, 'utf8'),
    }
  } catch {
    throw new OpsxSpecError(404, 'Spec not found')
  }
}

export function createOpsxSpecWatcher({
  projectRoot,
  watcher,
  notify,
}: {
  projectRoot: string
  watcher: {
    add(path: string): unknown
    on(event: 'change', listener: (path: string) => void): unknown
    off(event: 'change', listener: (path: string) => void): unknown
  }
  notify(event: OpsxSpecChangedEvent): void
}): () => void {
  const specsRoot = path.resolve(projectRoot, '.opsx', 'specs')
  const onChange = (changedPath: string) => {
    const absolutePath = path.resolve(changedPath)
    if (path.extname(absolutePath) !== '.md' || !isPathInside(specsRoot, absolutePath)) {
      return
    }
    notify({
      path: path.relative(projectRoot, absolutePath).split(path.sep).join('/'),
    })
  }

  watcher.add(specsRoot)
  watcher.on('change', onChange)
  return () => watcher.off('change', onChange)
}

function validateSpecPath(specPath: string): void {
  if (
    !specPath ||
    specPath.includes('\\') ||
    path.posix.isAbsolute(specPath) ||
    path.win32.isAbsolute(specPath) ||
    !specPath.startsWith(OPSX_SPECS_PREFIX) ||
    path.posix.extname(specPath) !== '.md'
  ) {
    throw new OpsxSpecError(400, 'Invalid Spec path')
  }

  const segments = specPath.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new OpsxSpecError(400, 'Invalid Spec path')
  }
}

function isPathInside(root: string, target: string): boolean {
  const relative = path.relative(root, target)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}
