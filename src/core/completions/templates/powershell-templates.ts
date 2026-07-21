/**
 * Static template strings for PowerShell completion scripts.
 * These are PowerShell-specific helper functions that never change.
 */

export const POWERSHELL_DYNAMIC_HELPERS = `# Dynamic completion helpers

function Get-OPSXChanges {
    $output = opsx __complete changes 2>$null
    if ($output) {
        $output | ForEach-Object {
            ($_ -split "\\t")[0]
        }
    }
}

function Get-OPSXSpecs {
    $output = opsx __complete specs 2>$null
    if ($output) {
        $output | ForEach-Object {
            ($_ -split "\\t")[0]
        }
    }
}
`;
