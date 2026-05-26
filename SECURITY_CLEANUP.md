**Secret Removal Checklist**

- Ensure exposed keys are revoked/rotated (you indicated done).
- Backup the repository before history rewrite: `git bundle create repo-backup.bundle --all` (the script does this).
- Run `scripts/remove_secrets.ps1` from the repository root and follow prompts.
- After force-push, ask all collaborators to reclone the repository.

Notes:
- Rewriting history is destructive to shared repos. Coordinate with team.
- If `git filter-repo` is not available after pip install, ensure the Python user scripts folder is in PATH or run the script via the installed module.
