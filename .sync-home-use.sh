#!/bin/bash
# Auto-sync local branch with origin/home-use
REPO="/Users/alayman/Documents/GitHub/BaseballLineup"
cd "$REPO" || exit 1

while true; do
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$current_branch" = "local" ]; then
    git fetch origin home-use --quiet 2>/dev/null
    LOCAL_HEAD=$(git rev-parse HEAD)
    REMOTE_HEAD=$(git rev-parse origin/home-use)
    if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
      echo "[$(date)] Changes detected on origin/home-use, syncing..."
      git merge origin/home-use --no-edit --quiet
      echo "[$(date)] Synced to $(git rev-parse --short HEAD)"
    fi
  fi
  sleep 300
done
