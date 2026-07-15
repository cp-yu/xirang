// Types
export {
  ArtifactSchema,
  SchemaYamlSchema,
  BUILT_IN_SCHEMA_IDS,
  FileDefinitionSchema,
  type Artifact,
  type FileDefinition,
  type SchemaYaml,
  type CompletedSet,
  type BlockedArtifacts,
} from './types.js';

// Schema loading and validation
export { loadSchema, parseSchema, SchemaValidationError } from './schema.js';

// Graph operations
export { ArtifactGraph } from './graph.js';

// State detection
export { detectCompleted } from './state.js';
export { artifactOutputExists, isGlobPattern, resolveArtifactOutputs } from './outputs.js';

// Schema resolution
export {
  resolveSchema,
  listSchemas,
  listSchemasWithInfo,
  getSchemaDir,
  getPackageSchemasDir,
  SchemaLoadError,
  type SchemaInfo,
} from './resolver.js';

// Instruction loading
export {
  loadTemplate,
  loadChangeContext,
  generateInstructions,
  formatChangeStatus,
  TemplateLoadError,
  type ChangeContext,
  type ArtifactInstructions,
  type DependencyInfo,
  type ArtifactStatus,
  type ChangeStatus,
} from './instruction-loader.js';
