#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-\}"
VERSION="${2:-\}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo $0 <source-directory> <version>"
  exit 1
fi

if [[ -z "$SOURCE_DIR" || -z "$VERSION" ]]; then
  echo "Usage: sudo $0 <source-directory> <version>"
  exit 1
fi

SOURCE_DIR="$(realpath "$SOURCE_DIR")"
APP_ROOT="/opt/relay-control"
RELEASE_DIR="$APP_ROOT/releases/$VERSION"

if [[ ! -f "$SOURCE_DIR/package.json" ]]; then
  echo "package.json not found in $SOURCE_DIR"
  exit 1
fi

if [[ -e "$RELEASE_DIR" ]]; then
  echo "Release already exists: $RELEASE_DIR"
  exit 1
fi

install -d -o root -g root -m 0755 "$RELEASE_DIR"
cp -a "$SOURCE_DIR/package.json" "$SOURCE_DIR/src" "$SOURCE_DIR/tsconfig.json" "$RELEASE_DIR/"
if [[ -f "$SOURCE_DIR/package-lock.json" ]]; then
  cp -a "$SOURCE_DIR/package-lock.json" "$RELEASE_DIR/"
fi

cd "$RELEASE_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build
npm prune --omit=dev
ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"

echo "Installed Relay Control $VERSION"
echo "Current -> $RELEASE_DIR"
echo "Service was not restarted automatically."
