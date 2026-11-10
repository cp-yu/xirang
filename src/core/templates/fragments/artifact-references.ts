import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getSchemaDir, resolveSchema } from '../../artifact-graph/index.js';

/** Static authoring inputs share the built-in schema's definitions and templates. */
export function artifactReferences(): Array<{ path: string; content: string }> {
  const schema = resolveSchema('semantic-model');
  const directory = getSchemaDir(schema.name)!;
  return schema.artifacts.map(artifact => ({
    path: `references/artifact-${artifact.id}.md`,
    content: `# ${artifact.id}\n\n## Definition\n\n\`\`\`yaml\n${YAML.stringify(artifact.definition)}\`\`\`\n\n## Guidance\n\n${artifact.instruction ?? ''}\n\n## Template\n\n${readFileSync(path.join(directory, 'templates', artifact.template), 'utf8')}`,
  }));
}
