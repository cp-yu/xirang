import { quoteLikeC4 } from './formatting-utils.js';

export function generateViews(projectName: string): string {
  return `views {
  view index {
    title ${quoteLikeC4(`${projectName} Architecture`)}
    include *
    autoLayout TopBottom
  }
}
`;
}
