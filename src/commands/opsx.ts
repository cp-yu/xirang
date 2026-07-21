import { Command } from 'commander';
import { OPSX_PATHS, readProjectOpsx, type OpsxNode, type OpsxRelation } from '../utils/opsx-utils.js';
import { FileSystemUtils } from '../utils/file-system.js';

interface QueryOptions {
  relations?: boolean;
  json?: boolean;
  depth?: string;
}

function collectNodes(bundle: NonNullable<Awaited<ReturnType<typeof readProjectOpsx>>>): OpsxNode[] {
  return [
    ...bundle.domains,
    ...bundle.capabilities,
    ...(bundle.invariants || []),
    ...(bundle.interfaces || []),
    ...(bundle.decisions || []),
    ...(bundle.evidence || []),
  ];
}

function parseDepth(value: string | undefined): { depth: number; explicit: boolean } {
  if (value === undefined) {
    return { depth: 1, explicit: false };
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('--depth must be a positive integer');
  }

  const depth = Number(value);
  if (depth < 1) {
    throw new Error('--depth must be a positive integer');
  }
  if (depth > 5) {
    throw new Error('--depth valid range is 1 to 5');
  }
  return { depth, explicit: true };
}

function relationKey(relation: OpsxRelation): string {
  return `${relation.from}\u0000${relation.type}\u0000${relation.to}`;
}

function collectSubgraph(
  seedIds: string[],
  depth: number,
  nodesById: Map<string, OpsxNode>,
  relations: OpsxRelation[],
): { nodes: OpsxNode[]; relations: OpsxRelation[] } {
  const orderedNodeIds: string[] = [];
  const visited = new Set<string>();
  let frontier = seedIds;

  for (const seedId of seedIds) {
    visited.add(seedId);
    orderedNodeIds.push(seedId);
  }

  const enqueueNode = (candidate: string, next: string[]): void => {
    if (!visited.has(candidate) && nodesById.has(candidate)) {
      visited.add(candidate);
      orderedNodeIds.push(candidate);
      next.push(candidate);
    }
  };

  for (let level = 0; level < depth; level += 1) {
    const next: string[] = [];
    const frontierSet = new Set(frontier);
    for (const relation of relations) {
      if (frontierSet.has(relation.from)) {
        enqueueNode(relation.to, next);
      }
      if (frontierSet.has(relation.to)) {
        enqueueNode(relation.from, next);
      }
    }
    frontier = next;
    if (frontier.length === 0) {
      break;
    }
  }

  const subgraphRelationKeys = new Set<string>();
  const subgraphRelations = relations.filter((relation) => {
    if (!visited.has(relation.from) || !visited.has(relation.to)) {
      return false;
    }
    const key = relationKey(relation);
    if (subgraphRelationKeys.has(key)) {
      return false;
    }
    subgraphRelationKeys.add(key);
    return true;
  });

  return {
    nodes: orderedNodeIds.map((id) => nodesById.get(id)).filter((node): node is OpsxNode => !!node),
    relations: subgraphRelations,
  };
}

export class OpsxCommand {
  async query(nodeIds: string | string[], options: QueryOptions = {}, projectRoot = '.'): Promise<void> {
    const mainPath = FileSystemUtils.joinPath(projectRoot, OPSX_PATHS.PROJECT_FILE);
    if (!await FileSystemUtils.fileExists(mainPath)) {
      throw new Error('OPSX files not found. Initialize with:\n  opsx bootstrap init\n  opsx init');
    }

    const bundle = await readProjectOpsx(projectRoot);
    if (!bundle) {
      throw new Error('OPSX files not found. Initialize with:\n  opsx bootstrap init\n  opsx init');
    }

    const nodes = collectNodes(bundle);
    const nodesById = new Map(nodes.map((candidate) => [candidate.id, candidate]));
    const requestedIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    const { depth, explicit } = parseDepth(options.depth);
    const seeds = requestedIds.filter((id) => nodesById.has(id));
    const missing = requestedIds.filter((id) => !nodesById.has(id));

    if (seeds.length === 0) {
      const available = nodes.slice(0, 5).map((candidate) => candidate.id).join(', ');
      const label = requestedIds.length === 1 ? `Node '${requestedIds[0]}'` : `Nodes '${requestedIds.join(', ')}'`;
      throw new Error(`${label} not found in OPSX. Available nodes: ${available}`);
    }

    const useSubgraphOutput = requestedIds.length > 1 || explicit;
    const output: Record<string, unknown> = {};

    if (!useSubgraphOutput) {
      const nodeId = seeds[0];
      output.node = nodesById.get(nodeId);

      output.relations = {
        incoming: bundle.relations.filter((relation) => relation.to === nodeId),
        outgoing: bundle.relations.filter((relation) => relation.from === nodeId),
      };
    } else {
      const subgraph = collectSubgraph(seeds, depth, nodesById, bundle.relations);
      output.seeds = seeds;
      output.nodes = subgraph.nodes;
      output.relations = subgraph.relations;
      output.missing = missing;
    }

    if (options.json) {
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    if (useSubgraphOutput) {
      console.log((output.nodes as OpsxNode[]).map((node) => node.id).join('\n'));
      return;
    }

    console.log((output.node as OpsxNode).id);
  }
}

export function registerOpsxCommand(rootProgram: Command): Command {
  const opsxCommand = rootProgram
    .command('opsx')
    .description('Query OPSX OPSX architecture data');

  opsxCommand
    .command('query <node-id...>')
    .description('Query an OPSX node')
    .option('--relations', 'Include relation details')
    .option('--depth <n>', 'Include related nodes up to depth n')
    .option('--json', 'Output as JSON')
    .action(async (nodeIds: string[], options: QueryOptions) => {
      try {
        const cmd = new OpsxCommand();
        await cmd.query(nodeIds, options);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exitCode = 1;
      }
    });

  return opsxCommand;
}
