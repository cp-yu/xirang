export function quoteLikeC4(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

export function indent(value: string, spaces = 2): string {
  const prefix = ' '.repeat(spaces);
  return value.split('\n').map(line => line ? `${prefix}${line}` : line).join('\n');
}
