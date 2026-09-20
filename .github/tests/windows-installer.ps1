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

# Exercise the native call with legacy quoting, including under PowerShell 7.
# Windows PowerShell 5.1 always uses legacy argument passing.
$PSNativeCommandArgumentPassing = 'Legacy'
Assert-NodeVersion
function node {
    param([string]$Option)
    if ($Option -ne '--version') { throw 'Version check must not use inline JavaScript' }
    $global:LASTEXITCODE = $script:nodeExitCode
    $script:nodeVersion
}
$script:nodeExitCode = 0
foreach ($version in @('v22.19.0', 'v24.14.0', 'v25.0.0')) {
    $script:nodeVersion = $version
    Assert-NodeVersion
}
foreach ($version in @('v20.19.0', 'v22.18.0')) {
    $script:nodeVersion = $version
    $failed = $false
    try { Assert-NodeVersion }
    catch { $failed = $_ -match 'requires Node.js >=22.19.0' }
    if (-not $failed) { throw "Unsupported Node.js $version was accepted" }
}
$script:nodeVersion = 'invalid-version'
$failed = $false
try { Assert-NodeVersion }
catch { $failed = $_ -match 'Could not parse Node.js version' }
if (-not $failed) { throw 'Invalid Node.js version was accepted' }
$script:nodeVersion = 'v24.14.0'
$script:nodeExitCode = 19
$failed = $false
try { Assert-NodeVersion }
catch { $failed = $_ -match 'exit code 19' }
if (-not $failed) { throw 'Failed Node.js version command was accepted' }
Remove-Item Function:node

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
