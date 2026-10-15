# AI Agents Context (test automation profile)

> Contexto global para agentes de IA en proyectos con perfil de test automation.

<!-- LOCKED: test-profile -->
### Test automation profile (Playwright)

Este proyecto usa el perfil `test` de ancleto-fre (`profile: test` en `.ancleto-fre.rc`).

- Workflows: planning (`fre-test-proposal`), generation (`fre-test-apply`), healing (`fre-test-heal`), coverage (`fre-test-coverage`), archive (`fre-test-archive`).
- Estructura: `testspec/specs/` (cobertura actual) + `testspec/changes/` (deltas), o reuso de `aspec/` cuando el proyecto ya lo usa.
- Framework: Playwright. Si no está instalado, los workflows degradan a análisis sin ejecución y lo reportan.
- Ruteo: cambio test-only → tester ampliado; cambio mixto → SDD general con apoyo del tester.
<!-- /LOCKED: test-profile -->
