# Review Notes

This document contains current repository review notes and remaining technical
cleanup items for `web.template`.

It is not a historical review of an exported project ZIP.

The architecture follows:

```text
Application --> Template --> Core
```

Only currently relevant observations should remain in this document.

---

## 1. Repository Hygiene

Local and generated development directories must not be committed.

Typical examples include:

```text
.git/
.expo/
node_modules/
```

Local configuration containing machine-specific or internal values should
also be handled carefully.

---

## 2. Current .env Handling

The repository currently contains this `.gitignore` rule:

```gitignore
.env*.local
```

A plain:

```text
.env
```

is therefore not explicitly ignored by the current rule.

This should be reviewed before final repository cleanup.

Possible approaches include:

```gitignore
.env
.env*.local
```

or using a documented example file such as:

```text
.env.example
```

for values that developers need to configure locally.

Do not commit secrets or internal server information.

---

## 3. Current Environment Variables

The currently observed `.env` variable names are:

```text
EXPO_PUBLIC_DEFAULT_LANGUAGE
EXPO_PUBLIC_DEFAULT_DEV_IP
EXPO_PUBLIC_DEFAULT_PROD_IP
EXPO_PUBLIC_OIDC_ISSUER
EXPO_PUBLIC_OIDC_CLIENT_ID
EXPO_PUBLIC_OIDC_SCOPES
EXPO_PUBLIC_LIVE_CONSOLE_PERFORMATIVE
```

The previous variable:

```text
EXPO_PUBLIC_APPLICATION_TITLE
```

is no longer part of the current `.env` configuration.

Application identity is now handled through the Application configuration
architecture.

---

## 4. Application Configuration

Concrete Application configuration now starts from:

```text
src/application/config/application.properties
```

The Template-side generator is:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The generated TypeScript configuration is written to:

```text
src/application/generated/applicationConfig.generated.ts
```

The generated configuration is exported through:

```text
src/application/index.ts
```

Application title and identity must not be reintroduced as direct Template
environment-variable dependencies.

---

## 5. Configuration Generation

The project currently provides:

```bash
npm run config:generate
```

Normal npm startup commands execute configuration generation through lifecycle
scripts.

Examples include:

```bash
npm start
npm run web
npm run android
npm run ios
```

Direct Expo commands can bypass those lifecycle hooks.

Therefore normal development startup should prefer the npm scripts.

---

## 6. Release Build Configuration Risk

The current test-release workflow still executes:

```bash
npx expo export -p web
```

directly.

It does not currently execute:

```bash
npm run config:generate
```

as an explicit build step.

This means release automation currently relies on the generated Application
configuration already being present and current.

Before final Application repository extraction, release builds should
explicitly guarantee configuration generation.

See:

```text
doc/test-release.md
```

---

## 7. Configuration Generator Ownership

The current generator lives in Template:

```text
src/template/config/build/generateApplicationConfig.mjs
```

but currently works with concrete Application paths.

During the current single-repository migration this is acceptable.

For the future architecture with separate repositories, the generator should
be reviewed so that reusable Template tooling does not permanently depend on a
specific concrete Application repository layout.

A possible future direction is a generic generator receiving explicit input
and output locations.

This is not required before the current documentation/master checkpoint.

---

## 8. Redux Migration

The current Redux store remains active under:

```text
src/template/state/store/
```

The extensible store factory has been prepared in parallel.

Application reducer registration also exists for the ongoing separation work.

The new factory must not be connected prematurely.

The migration should continue only after state typing, hooks and runtime
composition are safe.

See:

```text
doc/redux-state-management.md
```

---

## 9. Transitional Agent.Workbench State

Some Agent.Workbench-specific state and screens still physically exist under
Template during the migration.

This is intentional until the separate Agent.Workbench Application repository
and ownership boundaries are ready.

Physical location during migration must not be interpreted as final
architectural ownership.

Do not move these areas prematurely.

---

## 10. File Configuration Ownership

The file-configuration feature currently resides in Template.

However, parts of the feature depend on backend behavior such as:

```text
/api/app/settings/*
JettyConfiguration
```

This may represent Agent.Workbench-specific behavior.

Before final repository separation, review whether ownership should become:

```text
generic file infrastructure --> Template
product configuration flow  --> Application
```

See:

```text
doc/file-configuration-upload.md
```

---

## 11. Developer Console Ownership

Developer tools currently live under:

```text
src/template/components/developer-tools/
```

The Developer Console is currently implemented at:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

Its final ownership should be determined based on whether it is reusable
across applications.

Technical functionality does not automatically belong to Core.

---

## 12. Dynamic Content Ownership

Dynamic-content infrastructure currently lives under:

```text
src/template/components/dynamic-content/
```

Its final ownership should also be reviewed based on reuse across applications.

Do not move it into Application or Core without an explicit ownership
decision.

---

## 13. Source Comment Cleanup

A historical source comment remains in:

```text
src/template/hooks/useFileDropWeb.ts
```

The file currently contains an old path comment similar to:

```ts
// src/hooks/useFileDropWeb.ts
```

The implementation itself is already located correctly under Template.

This comment can be cleaned up during final source cleanup.

It does not require architectural work.

---

## 14. Old Test Directory Note

The previous review documentation referenced:

```text
src/testes
```

No matching top-level test directory under `src` was found during the current
review.

The old rename recommendation is therefore obsolete and has been removed from
the active review notes.

Test organization should only be documented based on the current repository
structure.

---

## 15. PWA Status

No dedicated files were found during the current review for:

```text
manifest.json
manifest.webmanifest
service-worker.js
service-worker.ts
sw.js
sw.ts
```

Therefore PWA support should not currently be documented as an implemented
project feature.

If PWA support is introduced later, implementation and documentation should be
added together.

---

## 16. Documentation Status

The project documentation is currently being aligned with the architecture:

```text
Application --> Template --> Core
```

Important documentation areas include:

```text
application separation
authentication
components
file configuration
project structure
Redux state management
server checking and switching
test releases
update system
architecture decisions
```

Historical paths should only remain when explicitly identified as historical
or removed architecture.

---

## 17. Documentation Validation

Useful final documentation checks include:

```bash
git diff --check
```

and searches for outdated paths:

```bash
git grep -n -i \
  -e "src/redux" \
  -e "src/screens" \
  -e "src/components" \
  -e "EXPO_PUBLIC_APPLICATION_TITLE" \
  -- doc README.md
```

Hits must be reviewed individually.

A search hit is not automatically an error because current documentation may
intentionally describe a removed path.

---

## 18. Encoding Validation

Documentation must remain valid UTF-8.

A PowerShell scan can be used to detect common mojibake markers:

```powershell
Get-ChildItem ".\doc" -Recurse -File |
  Select-String -Pattern "â","Ã","ï»¿","�"
```

No automatic repository-wide encoding rewrite should be performed.

If corruption is found, fix the affected file explicitly.

---

## 19. Current Priority

The current priority is:

```text
1. Finish documentation review
2. Review architecture documents and ADRs
3. Review README
4. Validate questionable documented source paths
5. Run TypeScript/tests/config generation
6. Validate runtime
7. Prepare clean documentation/source commits
8. Determine branch/master integration strategy
```

Do not perform broad structural refactoring while preparing this checkpoint.

---

## 20. Remaining Technical Review

Before final repository separation, the following topics still require an
explicit decision or validation:

```text
Application configuration generator interface
release workflow configuration generation
Redux runtime composition
Agent.Workbench-specific state extraction
Agent.Workbench-specific screen extraction
file-configuration ownership
developer-console ownership
dynamic-content ownership
Application branding contract
final build/deployment ownership
```

These are architecture migration topics, not blockers for keeping the current
Template application operational.

---

## 21. Safety Rules

Repository cleanup should follow these rules:

1. Do not run broad write scripts across `src` or `doc`.
2. Change explicit files only.
3. Do not rewrite generated API files during architecture cleanup.
4. Do not connect the new Redux store factory prematurely.
5. Do not move Agent.Workbench code before ownership is clear.
6. Do not introduce new concrete Application imports into Template.
7. Keep Core independent from Template and Application.
8. Validate old-path search hits instead of blindly replacing them.
9. Use npm lifecycle commands for normal runtime validation.
10. Keep documentation synchronized with actual implementation.

---

## 22. Success Criteria

The repository review is complete when:

1. Documentation reflects the current architecture.
2. Historical paths are clearly marked as historical.
3. Environment configuration is separated from Application identity.
4. Plain `.env` handling has been consciously reviewed.
5. Release configuration generation is deterministic.
6. Transitional Redux behavior remains stable.
7. Remaining Application-specific ownership questions are documented.
8. README and architecture documents agree with the detailed documentation.
9. TypeScript and tests pass.
10. The application starts successfully before the master checkpoint.