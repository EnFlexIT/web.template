# Review Notes

## Purpose

This document contains current repository review notes and remaining technical cleanup items for `web.template`.

It is not a historical review of an exported project snapshot.

The current architecture is:

```text
Application --> Template --> Core
```

Standard Agent.Workbench functionality belongs to Template.

HEMS is a concrete Application.

Only observations that are still relevant to the current repository should remain in this document.

---

## 1. Repository Hygiene

Local and generated development directories must not be committed unless explicitly required by the repository.

Typical examples include:

```text
.git/
.expo/
node_modules/
```

Machine-specific configuration and files containing internal or sensitive values must be handled carefully.

Repository cleanup should avoid unrelated formatting or generated-code changes.

---

## 2. Environment File Handling

The repository currently contains a `.gitignore` rule for:

```gitignore
.env*.local
```

A plain:

```text
.env
```

is therefore not covered by that rule alone.

This should be consciously reviewed.

Possible repository policies include explicitly ignoring `.env` and providing a documented example file where appropriate.

Example:

```gitignore
.env
.env*.local
```

and optionally:

```text
.env.example
```

Do not commit secrets, credentials or internal infrastructure information.

---

## 3. Current Environment Variables

Observed environment-variable responsibilities include technical runtime configuration such as:

```text
EXPO_PUBLIC_DEFAULT_LANGUAGE
EXPO_PUBLIC_DEFAULT_DEV_IP
EXPO_PUBLIC_DEFAULT_PROD_IP
EXPO_PUBLIC_OIDC_ISSUER
EXPO_PUBLIC_OIDC_CLIENT_ID
EXPO_PUBLIC_OIDC_SCOPES
EXPO_PUBLIC_LIVE_CONSOLE_PERFORMATIVE
```

Application identity must not be reintroduced as a direct Template environment dependency.

The former pattern based on:

```text
EXPO_PUBLIC_APPLICATION_TITLE
```

has been replaced by the Application configuration architecture.

Application identity belongs to Application configuration.

---

## 4. Application Configuration

Developer-facing Application configuration uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Responsibilities are:

```text
application.properties
    Application identity and metadata

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-specific navigation extensions
```

Generated TypeScript configuration is implementation output.

Developers should not need to modify generated TypeScript for normal Application configuration.

---

## 5. Legacy Configuration Names

The following names are obsolete and must not be reintroduced as active or planned configuration:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

The active configuration model is:

```text
application.properties
features.properties
navigation.properties
```

---

## 6. Configuration Generation

The current configuration tooling includes:

```text
src/template/config/build/generateApplicationConfig.mjs
```

Generated Application artifacts are written under:

```text
src/application/generated/
```

The project provides:

```bash
npm run config:generate
```

Normal startup should use npm scripts so configuration generation is not unintentionally bypassed.

Typical commands include:

```bash
npm start
npm run web
npm run android
npm run ios
```

When configuration has changed, generation should occur before TypeScript validation.

---

## 7. Automatic Application Screen Discovery

Application-owned screens are discovered automatically.

The discovery implementation is:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

The generated registry is:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

The current Agent.Workbench Application composition contains:

```text
src/application/screens/ExampleScreen.tsx
```

Concrete Applications should not require manual screen registration inside Template.

---

## 8. Release Build Configuration

Release workflows must deterministically use current generated Application configuration.

The current release documentation should be reviewed together with:

```text
doc/test-release.md
```

If a workflow calls Expo directly, verify whether it explicitly performs:

```bash
npm run config:generate
```

before export or build.

Release automation must not rely accidentally on stale generated files.

This should be verified from the actual workflow implementation before changing documentation or build scripts.

---

## 9. Configuration Tooling Ownership

Configuration tooling currently lives under Template build infrastructure:

```text
src/template/config/build/
```

This is appropriate because the tooling supports the Base Template/Application integration contract.

Future separate consumer repositories may require the tooling interface to accept explicit input and output locations.

Any such change should be driven by real consumer integration requirements rather than by speculative repository restructuring.

---

## 10. Redux Architecture

Reusable Redux infrastructure belongs to Template.

Important areas include:

```text
src/template/state/
src/template/state/store/
```

Agent.Workbench state is intentionally Template-owned.

Known area:

```text
src/template/state/agent-workbench/
```

Application-specific Redux state is optional.

The current Application extension point is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful product-specific Redux state.

This is valid and is not an incomplete Agent.Workbench extraction.

See:

```text
doc/redux-state-management.md
```

---

## 11. No Agent.Workbench Extraction

The previous plan to extract Agent.Workbench into a separate Application repository is no longer part of the architecture.

Do not treat the following as outstanding cleanup:

```text
Agent.Workbench state extraction
Agent.Workbench screen extraction
Agent.Workbench navigation extraction
separate Agent.Workbench Application repository
```

The current ownership is:

```text
Agent.Workbench standard functionality
    -> Template

HEMS
    -> concrete Application
```

---

## 12. File Configuration Ownership

The file-configuration functionality currently resides primarily in Template.

Known related areas include:

```text
src/template/screens/settings/
src/template/hooks/
src/template/state/settings/
src/template/components/design-system/
```

Some behavior may interact with backend-specific endpoints or configuration formats.

Ownership should therefore continue to follow responsibility:

```text
reusable file/configuration infrastructure
    -> Template

concrete product-only behavior
    -> Application
```

Do not move functionality merely because it is currently used by Agent.Workbench.

Review actual reuse and responsibility before changing ownership.

See:

```text
doc/file-configuration-upload.md
```

---

## 13. Developer Console

Developer tooling belongs to Template under the current architecture when it is reusable Base Template functionality.

Current area:

```text
src/template/components/developer-tools/
```

Developer Console implementation:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

The close button currently uses:

```tsx
{"\u00D7"}
```

to avoid encoding corruption of the multiplication sign.

The Developer Console should not be treated as an Agent.Workbench extraction candidate merely because it is primarily useful during Agent.Workbench development.

---

## 14. Dynamic Content

Dynamic-content infrastructure currently exists under:

```text
src/template/components/dynamic-content/
```

Its current location is consistent with reusable Template ownership.

A future ownership change should only occur if concrete evidence shows that functionality is specific to one consumer Application.

Do not move it into Core or Application based only on naming or historical usage.

---

## 15. Source Comment Cleanup

A historical source-path comment may remain in:

```text
src/template/hooks/useFileDropWeb.ts
```

For example:

```ts
// src/hooks/useFileDropWeb.ts
```

If still present, it can be corrected during small source-cleanup work.

This is not an architectural issue.

Verify the current file before changing it.

---

## 16. Test Directory Documentation

Historical documentation referenced:

```text
src/testes
```

This should not be treated as a current repository path unless it is confirmed in the source tree.

Test documentation must reflect the actual current repository structure.

Use source inspection before updating paths.

---

## 17. PWA Status

Previous review work did not identify dedicated files such as:

```text
manifest.json
manifest.webmanifest
service-worker.js
service-worker.ts
sw.js
sw.ts
```

Therefore PWA functionality should not be documented as implemented without current source verification.

If PWA support is introduced, implementation and documentation should be updated together.

---

## 18. Documentation Consistency

Architecture documentation must consistently describe:

```text
Application --> Template --> Core
```

with:

```text
Agent.Workbench standard functionality
    -> Template

HEMS
    -> concrete Application
```

The following must not reappear as active architecture:

```text
Agent.Workbench is a concrete Application
Agent.Workbench is transitional inside Template
Agent.Workbench requires its own Application repository
Agent.Workbench state must move to Application
Agent.Workbench screens must move to Application
```

Documentation should also use the current Application configuration model:

```text
application.properties
features.properties
navigation.properties
```

---

## 19. Documentation Search

Useful documentation searches include:

```bash
git grep -n -i \
  -e "src/redux" \
  -e "src/screens" \
  -e "src/components" \
  -e "EXPO_PUBLIC_APPLICATION_TITLE" \
  -- doc README.md
```

Search hits must be reviewed individually.

A hit is not automatically wrong because documentation may intentionally describe historical paths or removed behavior.

Architecture-specific searches should also review outdated Agent.Workbench assumptions and legacy configuration names.

---

## 20. Encoding Validation

Documentation and source files should remain valid UTF-8.

A PowerShell scan can help detect common mojibake markers:

```powershell
Get-ChildItem ".\doc" -Recurse -File |
  Select-String -Pattern "â","Ã","ï»¿","�"
```

Do not perform automatic repository-wide encoding rewrites.

If corruption is found, fix the affected file explicitly and validate the resulting diff.

---

## 21. Architecture Dependency Validation

Useful dependency checks include:

```bash
git grep -n "@/application/" -- src/template
```

Template must not import concrete Application implementation.

Application imports can be reviewed with:

```bash
git grep -n "@/template/" -- src/application
```

Unexpected direct Template imports should be reviewed against the intended public integration surface.

Do not change code solely to remove a grep result without understanding the dependency.

---

## 22. Current Documentation Priority

The current priority is:

```text
1. Finish architecture documentation cleanup.
2. Review remaining documentation for obsolete ownership statements.
3. Review architecture ADRs.
4. Review README.
5. Validate questionable documented source paths.
6. Run configuration generation.
7. Run TypeScript validation.
8. Run tests.
9. Validate runtime behavior.
10. Prepare a clean documentation checkpoint.
```

New feature development should follow after the documentation is internally consistent.

---

## 23. Remaining Technical Review

Current technical review topics include:

```text
Application configuration generator interface
release workflow configuration generation
file-configuration ownership details
consumer-facing public Template API
Application branding contract
consumer build/deployment ownership
HEMS consumer integration
```

These are not Agent.Workbench extraction tasks.

They should be addressed when required by actual implementation or consumer integration.

---

## 24. HEMS Consumer Validation

A future HEMS or equivalent consumer repository should validate the current Base Template contract.

The consumer should be able to provide:

```text
application.properties
features.properties
navigation.properties
Application-specific screens
Application translations
optional Application-specific Redux state
product-specific behavior
```

without requiring Template to import HEMS implementation.

This is the relevant future repository-separation test.

A separate Agent.Workbench consumer repository is not required by the current architecture.

---

## 25. Safety Rules

Repository cleanup should follow these rules:

1. Do not run broad write scripts across `src` or `doc`.
2. Change explicit files only.
3. Do not rewrite generated API files during unrelated cleanup.
4. Do not move Agent.Workbench standard functionality into Application.
5. Do not introduce concrete Application imports into Template.
6. Keep Core independent from Template and Application.
7. Search usages before moving or renaming source files.
8. Validate old-path search hits rather than replacing them blindly.
9. Use npm lifecycle commands for normal runtime validation.
10. Keep documentation synchronized with current implementation.
11. Verify uncertain implementation details from source instead of guessing.
12. Keep changes small and reviewable.

---

## 26. Validation Workflow

After documentation or architecture-related cleanup, use:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Run architecture dependency checks where relevant.

Runtime validation should use the normal npm startup path when behavior has changed.

---

## 27. Incorrect Legacy Review Items

The following must not be listed as remaining migration work:

```text
separate Agent.Workbench repository
Agent.Workbench state extraction
Agent.Workbench screen extraction
Agent.Workbench menu/tab extraction
removal of Agent.Workbench standard functionality from Template
```

Likewise, the following must not be listed as future configuration work:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

The correct architecture is already established.

---

## 28. Success Criteria

The repository review is complete when:

1. Documentation reflects the current architecture.
2. Historical paths are clearly marked as historical where retained.
3. Application identity remains separated from direct Template environment dependencies.
4. Developer-facing Application configuration uses the current `.properties` model.
5. Release builds deterministically use current generated configuration.
6. Agent.Workbench standard functionality remains correctly documented as Template-owned.
7. HEMS is documented as a concrete Application.
8. Remaining ownership questions are based on real implementation responsibilities.
9. README and architecture documents agree.
10. Configuration generation succeeds.
11. TypeScript validation succeeds.
12. Tests pass.
13. Dependency boundaries remain clean.
14. Runtime behavior remains stable.
15. The working tree contains only intentional changes before the documentation checkpoint.

---

## 29. Current Review Summary

The repository architecture is:

```text
Application --> Template --> Core
```

Core contains reusable technical capabilities.

Template contains the reusable application platform and standard Agent.Workbench functionality.

Application contains concrete product composition.

The current `src/application/` directory is the in-repository Agent.Workbench Application composition.

HEMS is a future concrete consumer Application.

The current review should focus on documentation consistency, deterministic build/configuration behavior and real consumer integration requirements.

It should not restart the previous Agent.Workbench extraction plan.
