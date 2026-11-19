let jsonOutput = false;

export function setJsonOutput(enabled: boolean): void {
  jsonOutput = enabled;
}

export function describeError(error: unknown): string {
  if (error instanceof AggregateError) return [error.message, ...error.errors.map(describeError)].join('\n');
  return error instanceof Error ? error.message : String(error);
}

export function diagnostic(message: string, code = 'COMMAND_ERROR', json = jsonOutput): void {
  console.error(json ? JSON.stringify({ code, message }) : message);
}
