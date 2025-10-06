<#
Start_Dev.ps1
One-click dev launcher for Nijjara ERP
Edit the variables in the CONFIG section before first run.
#>

# ===================== CONFIG =====================
$RepoPath       = "C:\Users\moham\nijjara_erp"      # <-- set to your local repo root
$VSCodePath     = "C:\Users\Moham\AppData\Local\Programs\Microsoft VS Code\Code.exe" # path to Code.exe
$ChromeExe      = "C:\Program Files\Google\Chrome\Application\chrome.exe" # path to chrome.exe
$ChromeProfile  = "Default"                        # <-- change to your DEV profile name (see note below)
$SheetsId       = "1GX4xeV3BHmSNlSrecy8Yh1rbg_NReDGoGd7GQs7MbHA"
$ScriptId       = "1qrftzu_h7pXtVOzKUKOtnMYWd83sXk7NpgIfa0ww99joKufkooP0jSUL"
$OpenNewWindow  = $true

# ===================== END CONFIG =====================

function Write-Log($msg){
  $t = (Get-Date).ToString("s")
  Write-Host "[$t] $msg"
}

# 1. Change to repo
Write-Log "Changing directory to repo: $RepoPath"
Set-Location $RepoPath

# 2. Git quick sync (safe: master pull only)
Write-Log "Checking git status..."
git status 2>$null
Write-Log "Switching to master and pulling latest..."
git checkout master 2>$null
git pull origin master 2>$null

# 3. clasp pull (sync Apps Script)
Write-Log "Running clasp pull..."
if (Get-Command clasp -ErrorAction SilentlyContinue) {
  clasp pull
} else {
  Write-Log "clasp not found on PATH. Install clasp or add it to PATH if you want automatic Apps Script sync."
}

# 4. Optional: npm install & lint if package.json exists
if (Test-Path (Join-Path $RepoPath "package.json")) {
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Log "Running npm install..."
    npm install
    # run lint if present
    $pkg = Get-Content package.json -Raw
    if ($pkg -match '"lint"') {
      Write-Log "Running npm run lint..."
      npm run lint
    }
  } else {
    Write-Log "npm not found on PATH."
  }
}

# 5. Open VSCode in repo
if (Test-Path $VSCodePath) {
  Write-Log "Opening VS Code..."
  Start-Process -FilePath $VSCodePath -ArgumentList "`"$RepoPath`""
} else {
  Write-Log "VSCode not found at $VSCodePath. Edit Start_Dev.ps1 to point to your Code.exe if you want it auto-opened."
}

# 6. Open Chrome with DEV profile and target URLs (Sheets + Apps Script)
$SheetsUrl = "https://docs.google.com/spreadsheets/d/$SheetsId/edit"
$ScriptUrl = "https://script.google.com/d/$ScriptId/edit"
$ChromeArgs = @()

# profile option
$ChromeArgs += "--profile-directory=`"$ChromeProfile`""
if ($OpenNewWindow) { $ChromeArgs += "--new-window" }

# append URLs
$ChromeArgs += $SheetsUrl
$ChromeArgs += $ScriptUrl

# Join args for Start-Process
$ArgString = $ChromeArgs -join " "
Write-Log "Launching Chrome (profile: $ChromeProfile) with Sheets + Script..."
if (Test-Path $ChromeExe) {
  Start-Process -FilePath $ChromeExe -ArgumentList $ArgString
} else {
  # fallback to using 'chrome' if chrome.exe not found at path (system PATH)
  Start-Process -FilePath "chrome" -ArgumentList $ArgString
}

Write-Log "Dev environment startup finished. Check terminal output for any errors."
