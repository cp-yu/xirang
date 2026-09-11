import { DEFAULT_PARTITION, relationshipIdentity, type EntityType, type Partition, type Relationship } from './types.js';

export interface SourceModule {
  partition: Partition;
  /** POSIX path relative to the model root; used only to locate writes, never semantics. */
  path: string;
}

export interface OrganizationWarning {
  identity: string;
  declared: EntityType;
  partition: Partition;
  path: string;
}

export interface ModelIndex {
  /** (entity type, identity) → owning unit; identity is scoped per entity type */
  moduleOf(declared: EntityType, identity: string): SourceModule | undefined;
  /** Relationships are located by their triple */
  moduleOfRelationship(relationship: Relationship): SourceModule | undefined;
  /** Organization convention mismatch: entry entity type does not match its partition */
  organizationWarnings(): OrganizationWarning[];
}

export interface IndexedEntity {
  identity: string;
  declared: EntityType;
  module: SourceModule;
}

export interface IndexedRelationship {
  relationship: Relationship;
  module: SourceModule;
}

export function createModelIndex(
  entities: IndexedEntity[],
  relationships: IndexedRelationship[],
): ModelIndex {
  const modules = new Map(entities.map(entry => [`${entry.declared}\u0000${entry.identity}`, entry.module]));
  const relationshipModules = new Map(
    relationships.map(entry => [relationshipIdentity(entry.relationship), entry.module]),
  );
  const warnings = entities
    .filter(entry => entry.module.partition !== DEFAULT_PARTITION[entry.declared])
    .map(entry => ({
      identity: entry.identity,
      declared: entry.declared,
      partition: entry.module.partition,
      path: entry.module.path,
    }));

  return {
    moduleOf: (declared, identity) => modules.get(`${declared}\u0000${identity}`),
    moduleOfRelationship: relationship => relationshipModules.get(relationshipIdentity(relationship)),
    organizationWarnings: () => warnings,
  };
}
