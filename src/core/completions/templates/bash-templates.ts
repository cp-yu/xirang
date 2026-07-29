/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_opsx_complete_changes() {
  local changes
  changes=$(xirang __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_opsx_complete_contracts() {
  local contracts
  contracts=$(xirang __complete contracts 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$contracts" -- "$cur"))
}

_opsx_complete_items() {
  local items
  items=$(xirang __complete changes 2>/dev/null | cut -f1; xirang __complete contracts 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}`;
