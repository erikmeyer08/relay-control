#!/usr/bin/env bash
set -euo pipefail

APP_USER="relay-control"
APP_GROUP="relay-control"
APP_ROOT="/opt/relay-control"
CONFIG_ROOT="/etc/relay-control"
STATE_ROOT="/var/lib/relay-control"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

if ! getent group "$APP_GROUP" >/dev/null; then
  groupadd --system "$APP_GROUP"
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --gid "$APP_GROUP" --home-dir "$STATE_ROOT" --shell /usr/sbin/nologin "$APP_USER"
fi

if getent group gpio >/dev/null; then
  usermod -a -G gpio "$APP_USER"
fi

install -d -o root -g root -m 0755 "$APP_ROOT" "$APP_ROOT/releases"
install -d -o root -g "$APP_GROUP" -m 0750 "$CONFIG_ROOT"
install -d -o "$APP_USER" -g "$APP_GROUP" -m 0750 "$STATE_ROOT"

if [[ ! -f "$CONFIG_ROOT/relay-control.env" ]]; then
  install -o root -g "$APP_GROUP" -m 0640 /dev/null "$CONFIG_ROOT/relay-control.env"
  cat > "$CONFIG_ROOT/relay-control.env" <<'ENV'
PORT=8081
BIND_ADDRESS=0.0.0.0
RELAY_CONTROL_CONFIG=/etc/relay-control/relay-control.yaml
RELAY_CONTROL_API_KEYS=REPLACE_ME
LOG_LEVEL=info
ENV
  echo "Created $CONFIG_ROOT/relay-control.env. Replace RELAY_CONTROL_API_KEYS before starting."
fi

if [[ ! -f "$CONFIG_ROOT/relay-control.yaml" ]]; then
  install -o root -g "$APP_GROUP" -m 0640 config/relay-control.example.yaml "$CONFIG_ROOT/relay-control.yaml"
  echo "Created $CONFIG_ROOT/relay-control.yaml. Verify every relay mapping before starting."
fi

install -o root -g root -m 0644 systemd/relay-control.service /etc/systemd/system/relay-control.service
systemctl daemon-reload

echo
echo "Relay Control service files installed."
echo "The service has NOT been enabled or started."
echo "Verify configuration, install a release, then enable it explicitly."
