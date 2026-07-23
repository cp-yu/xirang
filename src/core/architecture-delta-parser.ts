import type { SemanticElementKind, SemanticRelationshipKind } from '../utils/semantic-model.js';

export type ArchitectureDeltaOperationType = 'ADDED' | 'MODIFIED' | 'REMOVED';
export type ArchitectureDeltaEntity = 'element' | 'relationship' | 'elementKind' | 'relationshipKind';

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface ArchitectureDeltaDiagnostic {
  level: 'ERROR';
  code: string;
  path: string;
  message: string;
  location: SourceLocation;
}

export interface ArchitectureElementTarget {
  id: string;
  kind: string;
  parent: string | null;
  title: string;
  summary: string;
  metadata: Record<string, string | string[]>;
}

export interface ArchitectureRelationshipTarget {
  source: string;
  kind: string;
  target: string;
  description?: string;
}

export interface ArchitectureDeltaOperation {
  operation: ArchitectureDeltaOperationType;
  entity: ArchitectureDeltaEntity;
  identity: string;
  location: SourceLocation;
  target?: ArchitectureElementTarget | ArchitectureRelationshipTarget | SemanticElementKind | SemanticRelationshipKind;
}

export interface ArchitectureReplacementHint {
  from: string;
  to: string;
  location: SourceLocation;
}

export interface ArchitectureDelta {
  operations: ArchitectureDeltaOperation[];
  replacements: ArchitectureReplacementHint[];
}

export interface ArchitectureDeltaParseResult {
  delta: ArchitectureDelta | null;
  diagnostics: ArchitectureDeltaDiagnostic[];
}

type TokenType = 'identifier' | 'string' | 'arrow' | 'symbol' | 'eof';
interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
}

class ParseFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly location: SourceLocation,
  ) {
    super(message);
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;

  const location = (): SourceLocation => ({ line, column, offset });
  const advance = (value: string): void => {
    for (const char of value) {
      offset += 1;
      if (char === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
  };

  while (offset < source.length) {
    const rest = source.slice(offset);
    const whitespace = rest.match(/^\s+/)?.[0];
    if (whitespace) {
      advance(whitespace);
      continue;
    }
    const lineComment = rest.match(/^\/\/[^\n]*/)?.[0];
    if (lineComment) {
      advance(lineComment);
      continue;
    }
    const blockComment = rest.match(/^\/\*[\s\S]*?\*\//)?.[0];
    if (blockComment) {
      advance(blockComment);
      continue;
    }

    const start = location();
    if (rest[0] === "'") {
      let index = 1;
      let value = '';
      for (; index < rest.length; index += 1) {
        const char = rest[index];
        if (char === "'" && rest[index - 1] !== '\\') break;
        if (char === '\\' && index + 1 < rest.length) {
          const escaped = rest[++index];
          value += escaped === 'n' ? '\n' : escaped;
        } else {
          value += char;
        }
      }
      if (index >= rest.length) throw new ParseFailure('UNTERMINATED_STRING', 'Unterminated string', start);
      const raw = rest.slice(0, index + 1);
      tokens.push({ type: 'string', value, location: start });
      advance(raw);
      continue;
    }

    const arrow = rest.match(/^-\[([A-Za-z_][\w-]*)\]->/);
    if (arrow) {
      tokens.push({ type: 'arrow', value: arrow[1], location: start });
      advance(arrow[0]);
      continue;
    }
    const identifier = rest.match(/^[A-Za-z_][\w-]*/)?.[0];
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier, location: start });
      advance(identifier);
      continue;
    }
    if ('{}[],;'.includes(rest[0])) {
      tokens.push({ type: 'symbol', value: rest[0], location: start });
      advance(rest[0]);
      continue;
    }
    throw new ParseFailure('UNEXPECTED_TOKEN', `Unexpected token: ${rest[0]}`, start);
  }

  tokens.push({ type: 'eof', value: '', location: location() });
  return tokens;
}

class DeltaParser {
  private index = 0;
  readonly operations: ArchitectureDeltaOperation[] = [];
  readonly replacements: ArchitectureReplacementHint[] = [];

  constructor(private readonly tokens: Token[]) {}

  parse(): ArchitectureDelta {
    this.expectIdentifier('architectureDelta');
    this.expectSymbol('{');
    const sections = new Set<string>();
    while (!this.acceptSymbol('}')) {
      const token = this.peek();
      if (token.type !== 'identifier') this.fail('EXPECTED_DELTA_ENTRY', 'Expected replacement hint or operation section', token);
      if (token.value === 'replace') {
        this.parseReplacement();
        continue;
      }
      if (!['ADDED', 'MODIFIED', 'REMOVED'].includes(token.value)) {
        this.fail(
          token.value === 'extend' ? 'UNSUPPORTED_DELTA_SYNTAX' : 'EXPECTED_OPERATION_SECTION',
          token.value === 'extend' ? 'Unsupported architecture delta syntax: extend' : `Unsupported architecture delta section: ${token.value}`,
          token,
        );
      }
      if (sections.has(token.value)) this.fail('DUPLICATE_OPERATION_SECTION', `Duplicate operation section: ${token.value}`, token);
      sections.add(token.value);
      this.parseSection(token.value as ArchitectureDeltaOperationType);
    }
    this.expect('eof');
    if (this.operations.length === 0) this.fail('EMPTY_ARCHITECTURE_DELTA', 'Architecture delta must contain at least one identity operation', this.tokens[0]);
    this.validateConflicts();
    return { operations: this.operations, replacements: this.replacements };
  }

  private parseReplacement(): void {
    const start = this.expectIdentifier('replace').location;
    this.expectIdentifier('element');
    const from = this.expect('string').value;
    this.expectIdentifier('with');
    const to = this.expect('string').value;
    this.acceptSymbol(';');
    this.replacements.push({ from, to, location: start });
  }

  private parseSection(operation: ArchitectureDeltaOperationType): void {
    this.index += 1;
    this.expectSymbol('{');
    while (!this.acceptSymbol('}')) {
      const token = this.peek();
      if (token.type !== 'identifier') this.fail('EXPECTED_OPERATION', 'Expected element or relationship operation', token);
      if (token.value === 'extend') this.fail('UNSUPPORTED_DELTA_SYNTAX', 'Unsupported architecture delta syntax: extend', token);
      if (token.value === 'element') this.parseElementOperation(operation);
      else if (token.value === 'relationship') this.parseRelationshipOperation(operation);
      else this.fail('UNSUPPORTED_DELTA_ENTITY', `Unsupported architecture delta entity: ${token.value}`, token);
      this.acceptSymbol(';');
    }
  }

  private parseElementOperation(operation: ArchitectureDeltaOperationType): void {
    const location = this.expectIdentifier('element').location;
    const identity = this.peek();
    if (identity.type === 'string') {
      this.index += 1;
      const target = operation === 'REMOVED' ? undefined : this.parseElementTarget(identity.value);
      if (operation === 'REMOVED' && this.peek().value === '{') this.fail('REMOVED_PAYLOAD', 'REMOVED element must not declare a target payload', this.peek());
      this.operations.push({ operation, entity: 'element', identity: identity.value, location, ...(target ? { target } : {}) });
      return;
    }
    if (identity.type !== 'identifier') this.fail('EXPECTED_IDENTITY', 'Expected quoted element identity or Metamodel element kind', identity);
    this.index += 1;
    const target = operation === 'REMOVED' ? undefined : this.parseElementKindTarget();
    if (operation === 'REMOVED' && this.peek().value === '{') this.fail('REMOVED_PAYLOAD', 'REMOVED element kind must not declare a target payload', this.peek());
    this.operations.push({ operation, entity: 'elementKind', identity: identity.value, location, ...(target ? { target } : {}) });
  }

  private parseRelationshipOperation(operation: ArchitectureDeltaOperationType): void {
    const location = this.expectIdentifier('relationship').location;
    const identity = this.peek();
    if (identity.type === 'string') {
      this.index += 1;
      const arrow = this.expect('arrow');
      const targetId = this.expect('string').value;
      const target: ArchitectureRelationshipTarget = {
        source: identity.value,
        kind: arrow.value,
        target: targetId,
        ...this.parseRelationshipBody(),
      };
      const canonical = `${target.source}|${target.kind}|${target.target}`;
      this.operations.push({ operation, entity: 'relationship', identity: canonical, location, ...(operation === 'REMOVED' ? {} : { target }) });
      return;
    }
    if (identity.type !== 'identifier') this.fail('EXPECTED_IDENTITY', 'Expected relationship tuple or Metamodel relationship kind', identity);
    this.index += 1;
    const target = operation === 'REMOVED' ? undefined : this.parseRelationshipKindTarget();
    if (operation === 'REMOVED' && this.peek().value === '{') this.fail('REMOVED_PAYLOAD', 'REMOVED relationship kind must not declare a target payload', this.peek());
    this.operations.push({ operation, entity: 'relationshipKind', identity: identity.value, location, ...(target ? { target } : {}) });
  }

  private parseElementTarget(id: string): ArchitectureElementTarget {
    this.expectSymbol('{');
    const values = new Map<string, unknown>();
    while (!this.acceptSymbol('}')) {
      const key = this.expect('identifier');
      if (values.has(key.value)) this.fail('DUPLICATE_TARGET_FIELD', `Duplicate element field: ${key.value}`, key);
      if (key.value === 'metadata') values.set(key.value, this.parseMetadata());
      else if (key.value === 'parent' && this.peek().type === 'identifier' && this.peek().value === 'null') {
        this.index += 1;
        values.set(key.value, null);
      } else {
        values.set(key.value, this.expect('string').value);
      }
      this.acceptSymbol(';');
    }
    for (const field of ['kind', 'parent', 'title', 'summary', 'metadata']) {
      if (!values.has(field)) this.fail('INCOMPLETE_ELEMENT_TARGET', `Missing required element field: ${field}`, this.peek(-1));
    }
    const metadata = values.get('metadata') as Record<string, string | string[]>;
    if (typeof metadata.elementId === 'string' && metadata.elementId !== id) {
      this.fail('ELEMENT_IDENTITY_CONFLICT', `Element metadata elementId must match operation identity: ${id}`, this.peek(-1));
    }
    return {
      id,
      kind: values.get('kind') as string,
      parent: values.get('parent') as string | null,
      title: values.get('title') as string,
      summary: values.get('summary') as string,
      metadata,
    };
  }

  private parseMetadata(): Record<string, string | string[]> {
    this.expectSymbol('{');
    const metadata: Record<string, string | string[]> = {};
    while (!this.acceptSymbol('}')) {
      const key = this.expect('identifier');
      if (Object.hasOwn(metadata, key.value)) this.fail('DUPLICATE_METADATA_FIELD', `Duplicate metadata field: ${key.value}`, key);
      metadata[key.value] = this.peek().value === '[' ? this.parseStringArray() : this.expect('string').value;
      this.acceptSymbol(';');
    }
    return metadata;
  }

  private parseRelationshipBody(): Pick<ArchitectureRelationshipTarget, 'description'> {
    if (!this.acceptSymbol('{')) return {};
    let description: string | undefined;
    while (!this.acceptSymbol('}')) {
      const key = this.expect('identifier');
      if (key.value !== 'description') this.fail('UNSUPPORTED_RELATIONSHIP_FIELD', `Unsupported relationship field: ${key.value}`, key);
      if (description !== undefined) this.fail('DUPLICATE_TARGET_FIELD', 'Duplicate relationship field: description', key);
      description = this.expect('string').value;
      this.acceptSymbol(';');
    }
    return description === undefined ? {} : { description };
  }

  private parseElementKindTarget(): SemanticElementKind {
    this.expectSymbol('{');
    this.expectIdentifier('opsx');
    const values = this.parseOpsxProperties(new Set(['root', 'contract', 'parents', 'children']));
    this.expectSymbol('}');
    const contract = values.get('contract');
    if (contract !== 'required' && contract !== 'optional') {
      this.fail('INCOMPLETE_ELEMENT_KIND_TARGET', 'Missing required element kind constraint: contract', this.peek(-1));
    }
    return {
      ...(values.get('root') === true ? { root: true } : {}),
      contractPolicy: contract,
      ...(values.has('parents') ? { parents: values.get('parents') as string[] } : {}),
      ...(values.has('children') ? { children: values.get('children') as string[] } : {}),
    };
  }

  private parseRelationshipKindTarget(): SemanticRelationshipKind {
    this.expectSymbol('{');
    this.expectIdentifier('opsx');
    const values = this.parseOpsxProperties(new Set(['sourceKinds', 'targetKinds']));
    this.expectSymbol('}');
    return {
      ...(values.has('sourceKinds') ? { sourceKinds: values.get('sourceKinds') as string[] } : {}),
      ...(values.has('targetKinds') ? { targetKinds: values.get('targetKinds') as string[] } : {}),
    };
  }

  private parseOpsxProperties(allowed: Set<string>): Map<string, unknown> {
    this.expectSymbol('{');
    const values = new Map<string, unknown>();
    while (!this.acceptSymbol('}')) {
      const key = this.expect('identifier');
      if (!allowed.has(key.value)) this.fail('UNSUPPORTED_METAMODEL_CONSTRAINT', `Unsupported Metamodel constraint: ${key.value}`, key);
      if (values.has(key.value)) this.fail('DUPLICATE_TARGET_FIELD', `Duplicate Metamodel constraint: ${key.value}`, key);
      if (key.value === 'root') {
        const value = this.expect('identifier');
        if (!['true', 'false'].includes(value.value)) this.fail('INVALID_BOOLEAN', `Invalid boolean: ${value.value}`, value);
        values.set(key.value, value.value === 'true');
      } else if (key.value === 'contract') {
        values.set(key.value, this.expect('identifier').value);
      } else {
        values.set(key.value, this.parseIdentifierArray());
      }
      this.acceptSymbol(';');
    }
    return values;
  }

  private parseIdentifierArray(): string[] {
    this.expectSymbol('[');
    const values: string[] = [];
    while (!this.acceptSymbol(']')) {
      values.push(this.expect('identifier').value);
      this.acceptSymbol(',');
    }
    return values;
  }

  private parseStringArray(): string[] {
    this.expectSymbol('[');
    const values: string[] = [];
    while (!this.acceptSymbol(']')) {
      values.push(this.expect('string').value);
      this.acceptSymbol(',');
    }
    return values;
  }

  private validateConflicts(): void {
    const seen = new Map<string, ArchitectureDeltaOperation>();
    for (const operation of this.operations) {
      const key = `${operation.entity}:${operation.identity}`;
      const previous = seen.get(key);
      if (previous) {
        this.fail(
          'CONFLICTING_IDENTITY_OPERATIONS',
          `Conflicting operations for ${operation.entity} ${operation.identity}: ${previous.operation} and ${operation.operation}`,
          { type: 'identifier', value: operation.identity, location: operation.location },
        );
      }
      seen.set(key, operation);
    }
  }

  private peek(relative = 0): Token {
    return this.tokens[Math.max(0, Math.min(this.index + relative, this.tokens.length - 1))];
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) this.fail('UNEXPECTED_TOKEN', `Expected ${type}, received ${token.value || token.type}`, token);
    this.index += 1;
    return token;
  }

  private expectIdentifier(value: string): Token {
    const token = this.expect('identifier');
    if (token.value !== value) this.fail('UNEXPECTED_TOKEN', `Expected ${value}, received ${token.value}`, token);
    return token;
  }

  private expectSymbol(value: string): Token {
    const token = this.expect('symbol');
    if (token.value !== value) this.fail('UNEXPECTED_TOKEN', `Expected ${value}, received ${token.value}`, token);
    return token;
  }

  private acceptSymbol(value: string): boolean {
    const token = this.peek();
    if (token.type !== 'symbol' || token.value !== value) return false;
    this.index += 1;
    return true;
  }

  private fail(code: string, message: string, token: Token): never {
    throw new ParseFailure(code, message, token.location);
  }
}

export function parseArchitectureDelta(source: string, filePath = 'architecture-delta.c4'): ArchitectureDeltaParseResult {
  try {
    const delta = new DeltaParser(tokenize(source)).parse();
    return { delta, diagnostics: [] };
  } catch (error) {
    if (error instanceof ParseFailure) {
      return {
        delta: null,
        diagnostics: [{ level: 'ERROR', code: error.code, path: filePath, message: error.message, location: error.location }],
      };
    }
    throw error;
  }
}
