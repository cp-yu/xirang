function quoteLikeC4(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

export interface ArchitectureSkeletonContext {
  projectName: string;
  projectSummary: string;
}

export interface ArchitectureFileManifestEntry {
  relativePath: string;
  render: (context: ArchitectureSkeletonContext) => string;
}

export const ARCHITECTURE_FILE_MANIFEST: readonly ArchitectureFileManifestEntry[] = [
  { relativePath: 'specification.c4', render: renderSpecification },
  { relativePath: 'model.c4', render: renderProjectRoot },
  { relativePath: 'relations.c4', render: () => 'model {\n}\n' },
  { relativePath: 'views.c4', render: renderViews },
];

export function renderSpecification(): string {
  return `opsx {
  languageVersion '1'
}

specification {
  element capability {
    opsx { contract optional }
  }

  element domain {
    opsx { contract optional }
  }

  element project {
    opsx {
      root true
      contract required
    }
  }

  relationship constrains
  relationship consumes
  relationship invokes
  relationship precedes
  relationship produces
  relationship validates
}
`;
}

export function renderProjectRoot(context: ArchitectureSkeletonContext): string {
  return `model {
  projectRoot = project ${quoteLikeC4(context.projectName)} ${quoteLikeC4(context.projectSummary)} {
    metadata {
      elementId 'project.root'
    }
  }
}
`;
}

export function renderViews(context?: ArchitectureSkeletonContext): string {
  const title = context ? `\n    title ${quoteLikeC4(`${context.projectName} Architecture`)}` : '';
  return `views {
  view index {${title}
    include *
    autoLayout TopBottom
  }

  view refinement of projectRoot {
    include *
    autoLayout TopBottom
  }
}
`;
}
