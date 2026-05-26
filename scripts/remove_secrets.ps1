<#
Remove repository secrets from history using git-filter-repo.

USAGE (run from repository root):
  .\scripts\remove_secrets.ps1

This script will:
  - create a backup bundle
  - install git-filter-repo (pip)
  - remove `backend/.env` and `backend/vioverse-protect-key.md` from all commits
  - run git GC and force-push rewritten history to origin

WARNING:
  This rewrites history. All collaborators must re-clone or reset their local clones.
  Ensure you've rotated/revoked the exposed keys (you said done).
#>

Set-StrictMode -Version Latest
Write-Host "Starting secret removal workflow..." -ForegroundColor Cyan

if (-not (Test-Path -Path .git)) {
    Write-Error "Run this script from the repository root (where .git/ exists)."
    exit 1
}

# 1) Backup: create a bundle of the current repository
Write-Host "Creating repository backup bundle: repo-backup.bundle" -ForegroundColor Yellow
git bundle create repo-backup.bundle --all

# 2) Install git-filter-repo
Write-Host "Installing git-filter-repo (pip)..." -ForegroundColor Yellow
python -m pip install --user git-filter-repo

# 3) Run git-filter-repo to remove the sensitive paths from history
Write-Host "Removing paths from history: backend/.env, backend/vioverse-protect-key.md" -ForegroundColor Yellow
git filter-repo --invert-paths --path backend/.env --path backend/vioverse-protect-key.md

# 4) Cleanup
Write-Host "Cleaning reflog and running git gc..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5) Force-push rewritten history (confirm with user)
Write-Host "About to force-push rewritten history to 'origin'. THIS IS DESTRUCTIVE." -ForegroundColor Red
$confirm = Read-Host "Type 'FORCE' to continue and push, or anything else to abort"
if ($confirm -ne 'FORCE') {
    Write-Host "Aborted by user. Repository backup is at repo-backup.bundle" -ForegroundColor Yellow
    exit 0
}

Write-Host "Force-pushing all branches and tags to origin..." -ForegroundColor Yellow
git push origin --force --all
git push origin --force --tags

Write-Host "Done. Inform collaborators to reclone the repository." -ForegroundColor Green
Write-Host "Recommended: delete any local clones, then: git clone <repo-url>" -ForegroundColor Green
