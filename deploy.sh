#!/usr/bin/env bash
# Manual deploy of the JIMI web app — same steps as the CI workflow,
# but run from your laptop. Useful for hotfixes outside the
# git push → CI cycle.
#
# The server must have a git checkout of this repo at $DEPLOY_PATH and
# a `.env` with EXPO_PUBLIC_API_URL + APP_PORT (never overwritten here).
#
# Required env vars:
#   DEPLOY_HOST   ssh target like deploy@server.example.com
#   DEPLOY_PATH   absolute path on the host (e.g. /opt/jimi_app)
#
# Optional:
#   SSH_KEY       path to a private key (otherwise the agent is used)
#
# Example:
#   DEPLOY_HOST=deploy@my.server DEPLOY_PATH=/opt/jimi_app ./deploy.sh

set -euo pipefail
: "${DEPLOY_HOST:?ssh target like user@host}"
: "${DEPLOY_PATH:?absolute path on the host, e.g. /opt/jimi_app}"

SSH_OPTS=()
[[ -n "${SSH_KEY:-}" ]] && SSH_OPTS=(-i "$SSH_KEY")

ssh "${SSH_OPTS[@]}" "$DEPLOY_HOST" "set -e; \
  cd '$DEPLOY_PATH' && \
  git pull && \
  docker compose down && \
  docker compose build --no-cache && \
  docker compose up -d && \
  docker image prune -f"
