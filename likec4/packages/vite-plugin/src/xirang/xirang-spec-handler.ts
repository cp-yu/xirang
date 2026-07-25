import { promises as fs } from 'node:fs'
import path from 'node:path'

const OPSX_SPECS_PREFIX = '.xirang/specs/'

export interface XirangSpecIndex {
  getIndexedSpecs(element: string): Promise<readonly string[] | undefined>
}

export interface XirangSpecRegistrySnapshot {
  version: 1
  elements: Record<string, readonly string[]>
}

export interface XirangSpecResult {
  path: string
  md: string
}

export interface XirangSpecChangedEvent {
  path: string
}

export class XirangSpecError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function assertXirangProject(project: string, projects: readonly { id: string }[]): void {
  if (!projects.some(candidate => candidate.id === project)) {
    throw new XirangSpecError(404, 'Project not found')
  }
}

export async function readXirangSpecRegistry(registryFile: string): Promise<Map<string, readonly string[]>> {
  let value: unknown
  try {
    value = JSON.parse(await fs.readFile(registryFile, 'utf8'))
  } catch {
    throw new XirangSpecError(500, 'Unable to read Spec registry')
  }
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 1) {
    throw new XirangSpecError(500, 'Invalid Spec registry')
  }
  const elements = (value as { elements?: unknown }).elements
  if (!elements || typeof elements !== 'object' || Array.isArray(elements)) {
    throw new XirangSpecError(500, 'Invalid Spec registry')
  }
  const registry = new Map<string, readonly string[]>()
  for (const [element, specs] of Object.entries(elements)) {
    if (!Array.isArray(specs) || !specs.every(spec => typeof spec === 'string')) {
      throw new XirangSpecError(500, 'Invalid Spec registry')
    }
    registry.set(element, [...new Set(specs)].sort())
  }
  return registry
}

export async function readXirangSpec({
  projectRoot,
  element,
  specPath,
  index,
}: {
  projectRoot: string
  element: string
  specPath: string
  index: XirangSpecIndex
}): Promise<XirangSpecResult> {
  validateSpecPath(specPath)

  const indexedSpecs = await index.getIndexedSpecs(element)
  if (!indexedSpecs) {
    throw new XirangSpecError(404, 'Element not found')
  }
  if (!indexedSpecs.includes(specPath)) {
    throw new XirangSpecError(403, 'Spec is not indexed by this element')
  }

  const specsRoot = path.join(projectRoot, '.xirang', 'specs')
  const target = path.resolve(projectRoot, ...specPath.split('/'))
  let realSpecsRoot: string
  let realTarget: string
  try {
    ;[realSpecsRoot, realTarget] = await Promise.all([
      fs.realpath(specsRoot),
      fs.realpath(target),
    ])
  } catch {
    throw new XirangSpecError(404, 'Spec not found')
  }

  if (!isPathInside(realSpecsRoot, realTarget)) {
    throw new XirangSpecError(403, 'Spec path escapes the Specs directory')
  }

  try {
    return {
      path: specPath,
      md: await fs.readFile(realTarget, 'utf8'),
    }
  } catch {
    throw new XirangSpecError(404, 'Spec not found')
  }
}

export function createXirangSpecWatcher({
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
  notify(event: XirangSpecChangedEvent): void
}): () => void {
  const specsRoot = path.resolve(projectRoot, '.xirang', 'specs')
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
    throw new XirangSpecError(400, 'Invalid Spec path')
  }

  const segments = specPath.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new XirangSpecError(400, 'Invalid Spec path')
  }
}

function isPathInside(root: string, target: string): boolean {
  const relative = path.relative(root, target)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}
