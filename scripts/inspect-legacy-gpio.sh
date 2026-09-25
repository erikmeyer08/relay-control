#!/usr/bin/env bash
set -euo pipefail

LEGACY_IDS=(598 593 587 597)

echo "===== LEGACY GPIO LOOKUP ====="
for id in "${LEGACY_IDS[@]}"; do
  echo
  echo "--- GPIO $id ---"
  if [[ -e "/sys/class/gpio/gpio$id" ]]; then
    readlink -f "/sys/class/gpio/gpio$id" || true
    for f in direction value active_low; do
      if [[ -r "/sys/class/gpio/gpio$id/$f" ]]; then
        printf '%s=' "$f"
        cat "/sys/class/gpio/gpio$id/$f"
      fi
    done
  else
    echo "not currently exported in /sys/class/gpio"
  fi
done

echo
echo "===== GPIOCHIP BASES ====="
for chip in /sys/class/gpio/gpiochip*; do
  [[ -e "$chip" ]] || continue
  printf '%s base=' "$(basename "$chip")"
  cat "$chip/base" 2>/dev/null || echo "?"
  printf ' ngpio='
  cat "$chip/ngpio" 2>/dev/null || echo "?"
  printf ' label='
  cat "$chip/label" 2>/dev/null || echo "?"
done

echo
echo "===== KERNEL GPIO DEBUG ====="
if [[ -r /sys/kernel/debug/gpio ]]; then
  cat /sys/kernel/debug/gpio
else
  echo "/sys/kernel/debug/gpio unavailable without debugfs/root access"
fi
