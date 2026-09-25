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


## Updating a controller

Production controllers install the updater at:

```bash
sudo relay-control-update latest
```

or to install a specific version:

```bash
sudo relay-control-update 2.0.0
```

The updater downloads the GitHub Release archive and its SHA-256 checksum, verifies the archive, installs it under `/opt/relay-control/releases/<version>`, atomically switches `/opt/relay-control/current`, restarts the service, runs health checks, and rolls back automatically if the new release is unhealthy.

## Release process

A `vX.Y.Z` Git tag triggers the release workflow. CI validates shell syntax, TypeScript, tests, build output, and the production dependency audit before publishing:

- `relay-control-vX.Y.Z.tar.gz`
- `relay-control-vX.Y.Z.tar.gz.sha256`

The version in the Git tag must match `package.json`.
