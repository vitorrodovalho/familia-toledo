[CmdletBinding()]
param(
    [Alias("m")]
    [string]$Message,

    [switch]$UseCopilot,

    [switch]$Yes,

    [switch]$NoPush,

    [switch]$NoVerify,

    [string]$Remote = "origin",

    [ValidateRange(2000, 24000)]
    [int]$MaxDiffChars = 18000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$GitArgs
    )

    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Get-GitOutput {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$GitArgs
    )

    $output = & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE."
    }

    return ($output -join [Environment]::NewLine).Trim()
}

function Normalize-CommitMessage {
    param([string]$RawMessage)

    if ([string]::IsNullOrWhiteSpace($RawMessage)) {
        return $null
    }

    $clean = $RawMessage.Trim()
    $clean = $clean -replace "^\s*```[a-zA-Z0-9_-]*\s*", ""
    $clean = $clean -replace "\s*```\s*$", ""
    $clean = $clean -replace "^\s*(commit message|mensagem de commit)\s*:\s*", ""
    $clean = $clean.Trim()

    if (($clean.StartsWith('"') -and $clean.EndsWith('"')) -or ($clean.StartsWith("'") -and $clean.EndsWith("'"))) {
        $clean = $clean.Substring(1, $clean.Length - 2).Trim()
    }

    return $clean
}

function Get-FallbackCommitMessage {
    $nameStatus = Get-GitOutput diff --cached --name-status
    $entries = @(
        $nameStatus -split "\r?\n" |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )

    if ($entries.Count -eq 0) {
        return "Atualiza arquivos"
    }

    if ($entries.Count -gt 1) {
        return "Atualiza $($entries.Count) arquivos"
    }

    $parts = $entries[0] -split "\t"
    $status = $parts[0]
    $path = $parts[-1]

    switch -Regex ($status) {
        "^A" { return "Adiciona $path" }
        "^D" { return "Remove $path" }
        "^R" { return "Renomeia $path" }
        "^M" { return "Atualiza $path" }
        default { return "Atualiza $path" }
    }
}

function Get-CopilotInvocation {
    $copilot = Get-Command copilot -ErrorAction SilentlyContinue
    if (-not $copilot) {
        return $null
    }

    $source = $copilot.Source
    if (-not [string]::IsNullOrWhiteSpace($source)) {
        $baseDir = Split-Path -Parent $source

        $loaderPath = Join-Path $baseDir "node_modules\@github\copilot\npm-loader.js"
        if (Test-Path -LiteralPath $loaderPath) {
            $nodePath = Join-Path $baseDir "node.exe"
            if (-not (Test-Path -LiteralPath $nodePath)) {
                $node = Get-Command node.exe -ErrorAction SilentlyContinue
                if ($node) {
                    $nodePath = $node.Source
                }
            }

            if (Test-Path -LiteralPath $nodePath) {
                return @{
                    Executable = $nodePath
                    Arguments = @($loaderPath)
                }
            }
        }

        $cmdPath = Join-Path $baseDir "copilot.cmd"
        if (Test-Path -LiteralPath $cmdPath) {
            return @{
                Executable = $cmdPath
                Arguments = @()
            }
        }
    }

    return @{
        Executable = $source
        Arguments = @()
    }
}

function Invoke-NativeOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,

        [string[]]$Arguments = @()
    )

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $Executable
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true

    foreach ($argument in $Arguments) {
        [void]$startInfo.ArgumentList.Add($argument)
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo

    [void]$process.Start()
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return @{
        ExitCode = $process.ExitCode
        Output = @($stdout, $stderr) -join [Environment]::NewLine
    }
}

function Get-CopilotCommitMessage {
    $copilotInvocation = Get-CopilotInvocation
    if (-not $copilotInvocation) {
        Write-Warning "Copilot CLI nao encontrado. Instale com: npm install -g @github/copilot"
        return $null
    }

    $nameStatus = Get-GitOutput diff --cached --name-status
    $stat = Get-GitOutput diff --cached --stat
    $diff = Get-GitOutput diff --cached --no-ext-diff --unified=3

    if ($diff.Length -gt $MaxDiffChars) {
        $diff = $diff.Substring(0, $MaxDiffChars) + "`n[diff truncado pelo script]"
    }

    $prompt = @"
Gere uma mensagem de commit para as alteracoes staged abaixo.

Regras:
- Responda somente com a mensagem de commit.
- Primeira linha no imperativo, ate 72 caracteres.
- Use portugues do Brasil.
- Inclua corpo curto somente se ele ajudar a explicar multiplas alteracoes.
- Nao use Markdown, cercas de codigo, aspas ou introducoes.

Arquivos alterados:
$nameStatus

Resumo:
$stat

Diff:
$diff
"@

    $copilotArgs = @($copilotInvocation.Arguments) + @(
        "--silent",
        "--prompt",
        $prompt,
        "--no-color",
        "--no-custom-instructions",
        "--excluded-tools",
        "powershell,bash,read_powershell,read_bash,write_powershell,write_bash"
    )

    $result = Invoke-NativeOutput -Executable $copilotInvocation.Executable -Arguments $copilotArgs

    if ($result.ExitCode -ne 0) {
        Write-Warning "Copilot CLI falhou ao gerar a mensagem. Usando fallback local."
        Write-Verbose $result.Output
        return $null
    }

    return Normalize-CommitMessage $result.Output
}

$repoRoot = Get-GitOutput rev-parse --show-toplevel
Set-Location $repoRoot

$branch = Get-GitOutput branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
    throw "Repositorio esta em detached HEAD. Troque para uma branch antes de commitar."
}

Invoke-Git add -A

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "Nada para commitar."
    exit 0
}
if ($LASTEXITCODE -ne 1) {
    throw "Nao foi possivel verificar o diff staged."
}

$commitMessage = Normalize-CommitMessage $Message
if (-not $commitMessage -and $UseCopilot) {
    $commitMessage = Get-CopilotCommitMessage
}
if (-not $commitMessage) {
    $commitMessage = Get-FallbackCommitMessage
}

Write-Host ""
Write-Host "Mensagem de commit:"
Write-Host "-------------------"
Write-Host $commitMessage
Write-Host "-------------------"
Write-Host ""

if (-not $Yes) {
    $answer = Read-Host "Confirmar commit e push? [s/N]"
    if ($answer -notmatch "^(s|sim|y|yes)$") {
        Write-Host "Cancelado. As alteracoes continuam staged."
        exit 1
    }
}

$messageFile = New-TemporaryFile
try {
    Set-Content -LiteralPath $messageFile.FullName -Value $commitMessage -Encoding UTF8 -NoNewline

    $commitArgs = @("commit", "--file", $messageFile.FullName)
    if ($NoVerify) {
        $commitArgs += "--no-verify"
    }
    Invoke-Git @commitArgs
}
finally {
    Remove-Item -LiteralPath $messageFile.FullName -Force -ErrorAction SilentlyContinue
}

if ($NoPush) {
    Write-Host "Commit criado. Push ignorado por -NoPush."
    exit 0
}

& git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
if ($LASTEXITCODE -eq 0) {
    Invoke-Git push
}
else {
    Invoke-Git push -u $Remote $branch
}
