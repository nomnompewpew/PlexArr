# PlexArr Roadmap

This roadmap focuses on completing the wizard-driven setup so users can define paths, connect services, and deploy a working stack reliably.

## Goals

- Make the setup wizard fully capable of producing a working stack without manual edits.
- Validate paths, ports, and connectivity before deployment.
- Provide clear status, health, and recovery actions after deployment.

## Near-Term (Finish MVP)

- [ ] Define a single configuration schema (paths, services, ports, auth, optional services).
- [ ] Add backend validation for:
  - [ ] Required paths and permissions (PUID/PGID).
  - [ ] Port conflicts and reserved ports.
  - [ ] Service toggles with required fields.
- [ ] Wizard step: Storage paths
  - [ ] Media root, downloads, configs, optional per-library paths.
  - [ ] Inline validation + helper text for common layouts.
- [ ] Wizard step: Services
  - [ ] Enable/disable services.
  - [ ] Required URLs, ports, and API keys.
  - [ ] "Test connection" actions for Plex, *arr, Prowlarr, NZBGet, Overseerr.
- [ ] Review and deploy step
  - [ ] Show final compose summary and generated values.
  - [ ] "Deploy" action with progress + error detail.

## Mid-Term (Reliability + UX)

- [ ] Coordination flow with retries and clear status per integration.
- [ ] Post-deploy dashboard: container health, coordination status, and last errors.
- [ ] Log viewer for deployment + coordination events.
- [ ] Export/import config and "re-run coordination" action.

## Later (Polish + Advanced)

- [ ] Guided port forwarding tips per selected services.
- [ ] Optional SSL setup guidance (Nginx Proxy Manager).
- [ ] Multi-server support (advanced).
- [ ] Backup/restore for config and generated compose.

## Deliverables by Area

### Configuration
- [ ] config model with defaults and validation errors.
- [ ] saved config with versioned migrations.

### Connectivity
- [ ] service connection checks with friendly error messages.
- [ ] secure storage/redaction of credentials in UI and logs.

### Deployment
- [ ] generate compose from template using config schema.
- [ ] deploy pipeline with progress + rollback guidance.

### Observability
- [ ] service health checks.
- [ ] coordination status timeline.
- [ ] diagnostic export bundle.
