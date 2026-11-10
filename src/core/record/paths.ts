import path from 'node:path';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXPLORATION_ID = /^\d{8}T\d{6}Z-[a-f0-9]{8}$/;

export function validateRecordSlug(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid record slug: ${slug}`);
  return slug;
}

export function validateExplorationId(identity: string): string {
  if (!EXPLORATION_ID.test(identity)) throw new Error(`Invalid exploration identity: ${identity}`);
  return identity;
}

export function validateRecordFilename(filename: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/.test(filename) || filename.length > 255 || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])\./i.test(filename)) throw new Error(`Invalid record filename: ${filename}`);
  return filename;
}

export function recordRoot(projectRoot: string): string {
  return path.join(path.resolve(projectRoot), '.xirang', 'records');
}

export function assertContainedPath(
  root: string,
  target: string,
  pathApi: path.PlatformPath = path,
): string {
  const resolvedRoot = pathApi.resolve(root);
  const resolvedTarget = pathApi.resolve(target);
  const relative = pathApi.relative(resolvedRoot, resolvedTarget);
  if (relative === '..' || relative.startsWith(`..${pathApi.sep}`) || pathApi.isAbsolute(relative)) {
    throw new Error(`Managed path is outside its root: ${target}`);
  }
  return target;
}

export function projectRelativePosix(
  projectRoot: string,
  target: string,
  pathApi: path.PlatformPath = path,
): string {
  assertContainedPath(projectRoot, target, pathApi);
  return pathApi.relative(pathApi.resolve(projectRoot), pathApi.resolve(target)).split(pathApi.sep).join('/');
}

export const RECORD_SOURCE_FILE = 'record-source.md';
export const RECORD_COVERAGE_FILE = 'record-coverage.json';
