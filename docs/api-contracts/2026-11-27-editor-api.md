# Editor API contract checkpoint - 2026-11-27

Status: development checkpoint, not a production release.

API patch base:
9ded95795851934f9f1b1d10900141537120ca02

The accompanying patch preserves the local API contract changes:

- GET /user/backendRoles
- GET /user/groupRoles
- GET /menu/all
- abstractSiteContentType
- Menu response documentation corrections

The existing submodule pointer is intentionally unchanged.
The patch has not been merged into the shared RestAPIs repository.

For a clean API checkout at the specified base revision,
review and validate the patch before applying it:

    git -C src/api/definition apply --check ../../..//docs/api-contracts/2026-11-27-editor-api.patch

Do not regenerate or overwrite existing generated API clients
until the API contracts have been reconciled with upstream.

Validation on 2026-11-27:

- 144 Jest suites passed
- 1135 tests passed
- TypeScript passed
- Local Expo web export passed
- Structural menu writes remain disabled

Pending:

- Upstream API contract reconciliation
- Reproducibility from a clean checkout
- Live GET /menu/all verification
- Stored menu role verification
- Structural editor UI activation
- Production release approval

Application version remains 0.0.11.
