# Relay Control v2

Relay Control is a small hardware-focused API for controlling configured Linux GPIO relay channels. It is intentionally generic: applications such as Pool Control give those relays business meaning.

## v2 design

- TypeScript / Node.js
- No MongoDB dependency
- No scheduling engine
- Logical relay IDs mapped to GPIO numbers in local configuration
- API-key authenticated control API
- Direct GPIO state reads
- Safe startup state per relay
- Health and system/version endpoints
- systemd deployment target
- Memory GPIO driver for development and tests

## API

Public health endpoints:

- `GET /health/live`
- `GET /health/ready`

Authenticated API using the `x-api-key` header:

- `GET /api/v1/system`
- `GET /api/v1/relays`
- `GET /api/v1/relays/:id`
- `PUT /api/v1/relays/:id/state` with `{"state":"on"}` or `{"state":"off"}`
- `POST /api/v1/relays/all/off`

## Configuration

Copy `config/relay-control.example.yaml` to `/etc/relay-control/relay-control.yaml` and configure logical relay IDs and GPIO mappings.

Secrets stay outside Git in `/etc/relay-control/relay-control.env`.

## Development without GPIO hardware

Set `GPIO_DRIVER=memory`. The in-memory driver exercises the service without touching physical GPIO lines.

## Production safety

Do not deploy v2 over an existing controller until relay-to-GPIO mapping and active-high/active-low behavior have been verified against the running hardware.
