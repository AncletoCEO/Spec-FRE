# Product Context - [Product Name]

> **This file is EXTENSIBLE and will never be replaced by @ancleto/spec-fre**
>
> Fill in the sections according to your product/project. AI agents read this file to understand product-specific context.

## Project Type

- _Describe: Web App, REST API, Library, Monorepo, etc._

---

## Tech Stack

- **Runtime**: Node.js >=24.x
- **Language**: TypeScript
- **Framework**: _(e.g., Next.js / Express / React / NestJS)_
- **Testing**: _(e.g., Node Test Runner / Vitest / Jest)_
- **Infra / CI/CD**: _(e.g., GitHub Actions / AWS / Docker)_

---

## AI Memory (.ancleto-fre/memory.db)

- **Repository App ID**: ancleto-fre.[Product Name]
- **Scope**: `project:[Product Name]`

> Memory for this repository is persisted locally in `.ancleto-fre/memory.db` (SQLite + FTS5).
> Agents store architectural decisions and rules here automatically. It never leaves the repo.
> Consult via the `searchMemory` tool when modifying prior decisions, after a
> `<ContextOverflowWarning>`, or before major refactors / contract changes.

---

## Project Structure

```text
src/
  components/
  features/
  services/
aspec/
  config.yaml
  changes/
```

---

## Critical Files & Guardrails

**Take special care when modifying:**

- Core business logic in `src/core/`
- Infrastructure definitions & Environment variables

**Avoid:**

- Uncommunicated breaking changes in public APIs
- Adding external dependencies without checking existing ones

---

## Project Commands

- `npm run dev` → Development server
- `npm test` → Run tests
- `npm run build` → Production build
- `npm run lint` → Linter

<!-- LOCKED: test-block -->
Contexto gestionado por @ancleto/spec-fre — no editar: se re-aplica en cada actualizacion.
<!-- /LOCKED: test-block -->
