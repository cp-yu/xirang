/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_opsx_complete_changes() {
  local changes
  changes=$(opsx __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_opsx_complete_specs() {
  local specs
  specs=$(opsx __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_opsx_complete_items() {
  local items
  items=$(opsx __complete changes 2>/dev/null | cut -f1; opsx __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}`;
