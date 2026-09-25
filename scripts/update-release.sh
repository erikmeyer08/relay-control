#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${RELAY_CONTROL_REPOSITORY:-erikmeyer08/relay-control}"
REQUESTED_VERSION="${1:-latest}"
APP_ROOT="/opt/relay-control"
CONFIG_FILE="/etc/relay-control/relay-control.env"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo $0 [version|latest]"
  exit 1
fi

if [[ "$REQUESTED_VERSION" != "latest" ]] && [[ ! "$REQUESTED_VERSION" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version: $REQUESTED_VERSION"
  exit 1
fi

command -v curl >/dev/null || { echo "curl is required"; exit 1; }
command -v tar >/dev/null || { echo "tar is required"; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required"; exit 1; }

WORK_ROOT="$(mktemp -d)"
trap 'rm -rf "$WORK_ROOT"' EXIT

if [[ "$REQUESTED_VERSION" == "latest" ]]; then
  RELEASE_JSON="$(curl --fail --silent --show-error     -H 'Accept: application/vnd.github+json'     "https://api.github.com/repos/$REPOSITORY/releases/latest")"
  TAG="$(printf '%s' "$RELEASE_JSON" | node -e '
    let data="";
    process.stdin.on("data",c=>data+=c);
    process.stdin.on("end",()=>{
      const value=JSON.parse(data).tag_name;
      if (!value) process.exit(1);
      process.stdout.write(value);
    });
  ')"
else
  TAG="$REQUESTED_VERSION"
  [[ "$TAG" == v* ]] || TAG="v$TAG"
fi

VERSION="${TAG#v}"
ARCHIVE="relay-control-v$VERSION.tar.gz"
CHECKSUM="$ARCHIVE.sha256"
BASE_URL="https://github.com/$REPOSITORY/releases/download/$TAG"

echo "Downloading Relay Control $TAG..."
curl --fail --location --silent --show-error "$BASE_URL/$ARCHIVE" -o "$WORK_ROOT/$ARCHIVE"
curl --fail --location --silent --show-error "$BASE_URL/$CHECKSUM" -o "$WORK_ROOT/$CHECKSUM"

cd "$WORK_ROOT"
sha256sum --check "$CHECKSUM"

tar -xzf "$ARCHIVE"

SOURCE_DIR="$WORK_ROOT/relay-control"
if [[ ! -f "$SOURCE_DIR/package.json" || ! -f "$SOURCE_DIR/dist/server.js" ]]; then
  echo "Release archive is incomplete."
  exit 1
fi

PACKAGE_VERSION="$(node -p "require('$SOURCE_DIR/package.json').version")"
if [[ "$PACKAGE_VERSION" != "$VERSION" ]]; then
  echo "Release package version mismatch: expected $VERSION, got $PACKAGE_VERSION"
  exit 1
fi

RELEASE_DIR="$APP_ROOT/releases/$VERSION"
if [[ -d "$RELEASE_DIR" ]]; then
  echo "Release $VERSION is already installed."
else
  install -d -o root -g root -m 0755 "$RELEASE_DIR"
  cp -a "$SOURCE_DIR/." "$RELEASE_DIR/"
  cd "$RELEASE_DIR"
  npm ci --omit=dev --ignore-scripts
fi

PREVIOUS=""
if [[ -L "$APP_ROOT/current" ]]; then
  PREVIOUS="$(readlink -f "$APP_ROOT/current" || true)"
fi

ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
systemctl restart relay-control.service

PORT="$(awk -F= '/^PORT=/{print $2}' "$CONFIG_FILE" | tail -n1)"
PORT="${PORT:-8080}"

HEALTHY=false
for _ in {1..10}; do
  if curl --fail --silent --show-error "http://127.0.0.1:$PORT/health/live" >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  sleep 1
done

if [[ "$HEALTHY" == "true" ]]; then
  echo "Relay Control $VERSION installed and healthy."
  exit 0
fi

echo "Relay Control $VERSION failed health checks."

if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
  echo "Rolling back to $PREVIOUS"
  ln -sfn "$PREVIOUS" "$APP_ROOT/current"
  systemctl restart relay-control.service

  for _ in {1..10}; do
    if curl --fail --silent --show-error "http://127.0.0.1:$PORT/health/live" >/dev/null 2>&1; then
      echo "Rollback succeeded."
      exit 1
    fi
    sleep 1
  done

  echo "Rollback service also failed health checks."
fi

exit 1
