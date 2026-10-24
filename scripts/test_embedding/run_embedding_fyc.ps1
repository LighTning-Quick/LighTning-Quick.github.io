$ErrorActionPreference = 'Stop'
$embeddingPrefix = Join-Path $env:USERPROFILE 'micromamba/envs/embedding-fyc'
$embeddingPython = Join-Path $embeddingPrefix 'python.exe'
$embeddingScript = Join-Path $PSScriptRoot 'test_embeddding_fyc.py'

if (-not (Test-Path -LiteralPath $embeddingPython -PathType Leaf)) {
    throw "The embedding-fyc environment was not found at $embeddingPrefix"
}
if (-not (Test-Path -LiteralPath $embeddingScript -PathType Leaf)) {
    throw "The embedding script was not found at $embeddingScript"
}

$embeddingOriginalPath = $env:PATH

Push-Location -LiteralPath $PSScriptRoot
try {
    $env:PATH = "$embeddingPrefix;$embeddingPrefix/Library/bin;$embeddingPrefix/Scripts;$embeddingOriginalPath"
    & $embeddingPython -B -X utf8 $embeddingScript @args
    $embeddingExitCode = $LASTEXITCODE
}
finally {
    $env:PATH = $embeddingOriginalPath
    Pop-Location
}
exit $embeddingExitCode
