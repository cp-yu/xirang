import { renderFrontmatter } from '../model/frontmatter.js';

export interface ModelSkeletonContext {
  projectName: string;
  projectDefinition: string;
}

export interface ModelFileManifestEntry {
  relativePath: string;
  render: (context: ModelSkeletonContext) => string;
}

export const ROOT_ELEMENT_KIND = 'project';
export const ROOT_ELEMENT_IDENTITY = 'project.root';

/** Minimal seed: one root Element Kind plus the Project Root it types. */
export const MODEL_FILE_MANIFEST: readonly ModelFileManifestEntry[] = [
  {
    relativePath: `metamodel/${ROOT_ELEMENT_KIND}.md`,
    render: () => `${renderFrontmatter('element-kind', {
      identity: ROOT_ELEMENT_KIND,
      contract: 'optional',
      root: true,
    })}\nThe single Project Root of the Semantic Model.\n`,
  },
  {
    relativePath: `elements/${ROOT_ELEMENT_IDENTITY}.md`,
    render: context => renderFrontmatter('element-declaration', {
      identity: ROOT_ELEMENT_IDENTITY,
      kind: ROOT_ELEMENT_KIND,
      parent: null,
      title: context.projectName,
      definition: context.projectDefinition,
    }),
  },
];
