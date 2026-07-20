import type { LikeC4Model } from '../converters/types.js';
import { indent, quoteLikeC4 } from './formatting-utils.js';

export function generateRelationFile(model: LikeC4Model): string {
  const relations = model.relations.map(relation => {
    const description = relation.description
      ? ` {\n${indent(`description ${quoteLikeC4(relation.description)}`)}\n}`
      : '';
    return `${relation.source} -[${relation.kind}]-> ${relation.target}${description}`;
  });
  return `model {\n${indent(relations.join('\n\n'))}\n}\n`;
}
