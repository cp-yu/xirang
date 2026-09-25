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

/** Default semantic kinds and the Project Root skeleton; no project hierarchy is assumed. */
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
    relativePath: 'metamodel/element.md',
    render: () => `${renderFrontmatter('element-kind', {
      identity: 'element',
      contract: 'optional',
    })}
承载独立规范语义的 Element，可在任意抽象层级精化。
`,
  },
  {
    relativePath: 'metamodel/perspective.md',
    render: () => `${renderFrontmatter('element-kind', {
      identity: 'perspective',
      contract: 'optional',
    })}
按一个独立语义视角组织子级精化的 Element；纯呈现组织使用 View。
`,
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
