/**
 * Static template strings for Zsh completion scripts.
 * These are Zsh-specific helper functions that never change.
 */

export const ZSH_DYNAMIC_HELPERS = `# Dynamic completion helpers

# Use xirang __complete to get available changes
_opsx_complete_changes() {
  local -a changes
  while IFS=$'\\t' read -r id desc; do
    changes+=("$id:$desc")
  done < <(xirang __complete changes 2>/dev/null)
  _describe "change" changes
}

# Use xirang __complete to get available Element Contracts
_opsx_complete_contracts() {
  local -a contracts
  while IFS=$'\\t' read -r id desc; do
    contracts+=("$id:$desc")
  done < <(xirang __complete contracts 2>/dev/null)
  _describe "contract" contracts
}

# Get both changes and Element Contracts
_opsx_complete_items() {
  local -a items
  while IFS=$'\\t' read -r id desc; do
    items+=("$id:$desc")
  done < <(xirang __complete changes 2>/dev/null)
  while IFS=$'\\t' read -r id desc; do
    items+=("$id:$desc")
  done < <(xirang __complete contracts 2>/dev/null)
  _describe "item" items
}`;
