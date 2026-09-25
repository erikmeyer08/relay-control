#!/usr/bin/env bash
set -euo pipefail

VERSION="$\{1:-\}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo $0 <version>"
  exit 1
fi

if [[ -z "$VERSION" ]]; then
  echo "Usage: sudo $0 <version>"
  exit 1
fi

APP_ROOT="/opt/relay-control"
TARGET="$APP_ROOT/releases/$VERSION"

if [[ ! -d "$TARGET" ]]; then
  echo "Release not found: $TARGET"
  exit 1
fi

ln -sfn "$TARGET" "$APP_ROOT/current"
systemctl restart relay-control.service
sleep 2

PORT="$(awk -F= '/^PORT=/{print $2}' /etc/relay-control/relay-control.env | tail -n1)"
PORT="$\{PORT:-8080\}"

if curl --fail --silent --show-error "http://127.0.0.1:$PORT/health/live" >/dev/null; then
  echo "Rolled back to $VERSION; health check passed."
else
  echo "Rollback target failed health check."
  exit 1
fi
