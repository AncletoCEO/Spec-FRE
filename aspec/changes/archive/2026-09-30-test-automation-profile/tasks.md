# Tasks: Perfil de test automation estilo spectest

## Fase 1 — Concepto de perfil en el CLI

- [x] Agregar flag `--profile` a `init`/`install` con persistencia `profile:` en `.ancleto-fre.rc` (default: perfil general).
- [x] Hacer que `installAgentSkills` y `copyTemplates` seleccionen activos según `profile`.
- [x] Verificar que el perfil general instala exactamente lo mismo que hoy (test de no-regresión).

## Fase 2 — Activos del perfil test

- [x] Crear `profiles/test/agents/tester.md` con los 4 workflows (planning/generation/healing/coverage).
- [x] Crear `profiles/test/agents/reviewer.md` orientado a tests.
- [x] Crear comandos `fre-test-proposal`, `fre-test-apply`, `fre-test-heal`, `fre-test-coverage`, `fre-test-archive` (markdown puro, patrón `fre-*`).
- [x] Crear `profiles/test/templates/AGENTS.md` con convenciones Playwright + estructura `testspec/`.

## Fase 3 — Ruteo, compatibilidad y guía

- [x] Agregar regla de ruteo test-only/mixto al orchestrator (general; la variante Copilot la hereda sola cuando `add-copilot-support` convierta `agents/*.md` a prompts).
- [x] Verificar instalación combinada perfil+agente (ortogonalidad con agente existente; `--agent copilot` queda pendiente de `add-copilot-support`).
- [x] Validar en fixture: `fre-test-heal` repara un test fallido; `fre-test-coverage` reporta brecha conocida.
- [x] Escribir guía test-vs-general y correr suite `node --test` en verde.
