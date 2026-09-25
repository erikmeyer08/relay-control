#!/usr/bin/env bash
set -euo pipefail

REF="${1:-rewrite/v2}"
REPO_URL="${RELAY_CONTROL_REPO_URL:-https://github.com/erikmeyer08/relay-control.git}"
WORK_ROOT="$(mktemp -d)"
trap 'rm -rf "$WORK_ROOT"' EXIT

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo $0 [git-ref]"
  exit 1
fi

git clone --depth 1 --branch "$REF" "$REPO_URL" "$WORK_ROOT/source"
VERSION="$(node -p "require('$WORK_ROOT/source/package.json').version")"
STAMP="$(date -u +%Y%m%d%H%M%S)"
RELEASE_VERSION="$VERSION-$STAMP"

PREVIOUS=""
if [[ -L /opt/relay-control/current ]]; then
  PREVIOUS="$(readlink -f /opt/relay-control/current || true)"
fi

"$(dirname "$0")/install-release.sh" "$WORK_ROOT/source" "$RELEASE_VERSION"
systemctl restart relay-control.service
sleep 3

PORT="$(awk -F= '/^PORT=/{print $2}' /etc/relay-control/relay-control.env | tail -n1)"
PORT="${PORT:-8080}"

if curl --fail --silent --show-error "http://127.0.0.1:$PORT/health/live" >/dev/null; then
  echo "Relay Control $RELEASE_VERSION is healthy."
  exit 0
fi

echo "New release failed health check."
if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
  ln -sfn "$PREVIOUS" /opt/relay-control/current
  systemctl restart relay-control.service
  echo "Rolled back to $PREVIOUS"
fi
exit 1
