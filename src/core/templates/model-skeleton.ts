import { renderFrontmatter } from '../model/frontmatter.js';
import type { ElementKind } from '../model/types.js';

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
export const PERSPECTIVE_KIND: ElementKind = {
  identity: 'perspective',
  contract: 'optional',
  parents: ['project', 'perspective'],
  children: ['perspective', 'domain', 'capability'],
  body: '`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。',
};

export const PERSPECTIVE_KIND_FILE: ModelFileManifestEntry = {
  relativePath: 'metamodel/perspective.md',
  render: () => `${renderFrontmatter('element-kind', {
    identity: PERSPECTIVE_KIND.identity,
    contract: PERSPECTIVE_KIND.contract,
    parents: PERSPECTIVE_KIND.parents,
    children: PERSPECTIVE_KIND.children,
  })}\n${PERSPECTIVE_KIND.body}\n`,
};

/** Minimal seed: managed Element Kinds plus the Project Root, so a fresh model validates. */
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
    relativePath: 'metamodel/domain.md',
    render: () => renderFrontmatter('element-kind', {
      identity: 'domain',
      contract: 'optional',
    }),
  },
  {
    relativePath: 'metamodel/capability.md',
    render: () => renderFrontmatter('element-kind', {
      identity: 'capability',
      contract: 'optional',
    }),
  },
  PERSPECTIVE_KIND_FILE,
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
