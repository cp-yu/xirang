import path from 'node:path';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXPLORATION_ID = /^\d{8}T\d{6}Z-[a-f0-9]{8}$/;

export function validateFramingSlug(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid framing slug: ${slug}`);
  return slug;
}

export function validateExplorationId(identity: string): string {
  if (!EXPLORATION_ID.test(identity)) throw new Error(`Invalid exploration identity: ${identity}`);
  return identity;
}

export function framingChangesRoot(projectRoot: string): string {
  return path.join(path.resolve(projectRoot), '.xirang', 'changes');
}

export function managedFramingFilename(slug: string, explorationId: string): string {
  return `.explore-${validateFramingSlug(slug)}-${validateExplorationId(explorationId)}.md`;
}

export function managedFramingPath(projectRoot: string, slug: string, explorationId: string): string {
  return path.join(framingChangesRoot(projectRoot), managedFramingFilename(slug, explorationId));
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
