$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot '../../home/.chezmoiscripts/windows/run_onchange_before_install-packages.ps1.tmpl'
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path $source), [ref]$null, [ref]$errors)
if ($errors.Count) { throw ($errors -join '; ') }
# Load only helper definitions; never run package installation or service setup.
$helpers = $ast.FindAll({ param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst]
}, $false)
foreach ($helper in $helpers) { Invoke-Expression $helper.Extent.Text }

$failed = $false
try { Invoke-Native (Get-Process -Id $PID).Path @('-NoProfile', '-Command', 'exit 23') }
catch { $failed = $_ -match 'exit code 23' }
if (-not $failed) { throw 'Native command failure was swallowed' }

$script:refreshed = 0
function Update-SessionPath { $script:refreshed++ }
function winget {
    if ($args[0] -eq 'list') { $global:LASTEXITCODE = 1; return }
    Set-Item Function:global:dotfiles-test-npm { 'mock npm' }
    $global:LASTEXITCODE = 0
}
Install-WingetPackage 'Test.Node' 'dotfiles-test-npm'
if ($script:refreshed -ne 1) { throw 'PATH was not refreshed after installation' }
Remove-Item Function:dotfiles-test-npm

function winget { $global:LASTEXITCODE = 27 }
$failed = $false
try { Install-WingetPackage 'Test.Node' 'dotfiles-test-missing' }
catch { $failed = $_ -match 'exit code 27' }
if (-not $failed) { throw 'Failed winget installation was marked successful' }
Write-Host 'Windows installer regression tests passed'
