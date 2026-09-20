param([Parameter(Mandatory)][string]$Directory)
$ErrorActionPreference = 'Stop'
$files = @(Get-ChildItem -LiteralPath $Directory -Filter '*.ps1' -Recurse)
if ($files.Count -eq 0) { throw 'No rendered PowerShell scripts found' }
foreach ($file in $files) {
    $parseErrors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$null, [ref]$parseErrors)
    if ($parseErrors.Count -gt 0) {
        throw "Invalid PowerShell in $($file.FullName): $($parseErrors -join '; ')"
    }
}
Write-Host "Validated $($files.Count) rendered PowerShell files"
