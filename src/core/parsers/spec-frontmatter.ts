import { parse } from 'yaml';

export type SpecFrontmatterIssueCode =
  | 'MALFORMED_FRONTMATTER'
  | 'MULTIPLE_SPEC_OWNERS'
  | 'LEGACY_SPEC_OWNERSHIP';

export interface SpecFrontmatterIssue {
  code: SpecFrontmatterIssueCode;
  message: string;
  values?: string[];
}

export interface SpecFrontmatter {
  element: string | null;
  issues?: SpecFrontmatterIssue[];
}

export function parseSpecFrontmatter(content: string): SpecFrontmatter {
  const normalized = content.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) return { element: null };

  const endIndex = normalized.indexOf('\n---', 4);
  if (endIndex === -1) {
    return issue('MALFORMED_FRONTMATTER', 'Frontmatter is missing its closing delimiter');
  }

  let data: unknown;
  try {
    data = parse(normalized.slice(4, endIndex));
  } catch (error) {
    return issue('MALFORMED_FRONTMATTER', error instanceof Error ? error.message : 'Invalid YAML frontmatter');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return { element: null };
  const frontmatter = data as Record<string, unknown>;
  if (Array.isArray(frontmatter.element)) {
    return issue('MULTIPLE_SPEC_OWNERS', 'Spec frontmatter element must be a singular string');
  }
  if (Array.isArray(frontmatter.capabilities)) {
    return issue(
      'LEGACY_SPEC_OWNERSHIP',
      'Spec frontmatter capabilities ownership is not supported by the v1 profile',
      frontmatter.capabilities.filter((value): value is string => typeof value === 'string'),
    );
  }

  return {
    element: typeof frontmatter.element === 'string' && frontmatter.element.trim() !== ''
      ? frontmatter.element
      : null,
  };
}

function issue(code: SpecFrontmatterIssueCode, message: string, values?: string[]): SpecFrontmatter {
  return { element: null, issues: [{ code, message, ...(values ? { values } : {}) }] };
}
