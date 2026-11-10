let jsonOutput = false;

export function setJsonOutput(enabled: boolean): void {
  jsonOutput = enabled;
}

export function diagnostic(message: string, code = 'COMMAND_ERROR', json = jsonOutput): void {
  console.error(json ? JSON.stringify({ code, message }) : message);
}
