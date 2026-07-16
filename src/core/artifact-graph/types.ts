import { z } from 'zod';

export const BUILT_IN_SCHEMA_IDS = ['spec-driven', 'bootstrap'] as const;
export const BuiltInSchemaIdSchema = z.enum(BUILT_IN_SCHEMA_IDS);

export const FileDefinitionSchema = z.object({
  purpose: z.string().trim().min(1),
  compilationRole: z.string().trim().min(1),
  content: z.object({
    includes: z.array(z.string().trim().min(1)).min(1),
    excludes: z.array(z.string().trim().min(1)).min(1),
  }),
  writePolicy: z.enum([
    'agent-authored',
    'cli-generated',
    'review-controlled',
    'workflow-managed',
  ]),
  validation: z.array(z.string().trim().min(1)).min(1),
});

export const ManagedFileSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  definition: FileDefinitionSchema,
  phase: z.string().optional(),
  derivedFrom: z.array(z.string()).optional(),
  promotionTarget: z.string().optional(),
  retention: z.string().optional(),
});

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: z.string().min(1, { error: 'generates field is required' }),
  completionMarker: z.string().min(1).optional(),
  description: z.string(),
  template: z.string().min(1, { error: 'template field is required' }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
  definition: FileDefinitionSchema.optional(),
  files: z.array(z.string()).optional(),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: z.string().nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  files: z.array(ManagedFileSchema).optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Optional apply phase configuration (for schema-aware apply instructions)
  apply: ApplyPhaseSchema.optional(),
});

// Derived TypeScript types
export type BuiltInSchemaId = z.infer<typeof BuiltInSchemaIdSchema>;
export type FileDefinition = z.infer<typeof FileDefinitionSchema>;
export type ManagedFile = z.infer<typeof ManagedFileSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// Per-change metadata schema
// Note: schema field is validated at parse time against available schemas
// using a lazy import to avoid circular dependencies
export const ChangeMetadataSchema = z.object({
  // Required: which workflow schema this change uses
  schema: BuiltInSchemaIdSchema,

  // Optional: creation timestamp (ISO date string)
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'created must be YYYY-MM-DD format',
    })
    .optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}

