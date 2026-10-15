# Design: Skill `fre-review` de revisión de código

## Approach

Skill de solo lectura (`read: true, write: false, edit: false, bash: false` como `reviewer`), sin binarios externos, invocable por el usuario vía `/fre-review <scope>`. El flujo es: (1) parsear el scope declarado, (2) resolverlo a diff concreto con git, (3) analizar solo ese diff con los 4 detectores — leyendo fuera del diff únicamente como evidencia comparativa — y (4) emitir reporte estructurado. No toca `verify`, `security` ni `reviewer`: es un asset nuevo (`skills/fre-review/SKILL.md` + `commands/fre-review.md`) que se instala con el mecanismo existente por host.

Decisiones de diseño:
- Gramática de scope MVP (primera que matchee, en este orden): `#<nro>` → `git log --grep="#<nro>"` (commits cuyo mensaje contiene el ticket); rango git explícito (`A..B`, `HEAD~n`); paths/directorios existentes; si no hay input ni inferencia clara, listar scopes candidatos y preguntar (nunca adivinar, como `fre-verify`).
- Si el scope menciona un Work Item de Azure DevOps, el grounding es de `@context-resolver` (misma regla que `fre-verify`); la skill recibe el ID ya resuelto y lo trata como `#nro`.
- Lectura fuera del diff permitida solo como evidencia: buscar definiciones gemelas (detector redundante), buscar referencias/llamadas (detector sin uso) y consultar el mapa del proyecto (`PRODUCT.md`, `aspec/specs/`, estructura de directorios) para ubicación.
- Severidades: CRITICAL solo para duplicación literal o dead code probado dentro del scope; redundancia inferida o ubicación discutible → WARNING o SUGGESTION. Ante duda, degradar.

## Architecture

```text
/fre-review "<scope>"
  └─► skills/fre-review/SKILL.md
        ├── 1. Resolver scope → lista de archivos:líneas
        │     #123 ──► git log --grep="#123" --format=%H → git diff H^ H
        │     A..B ──► git diff A..B
        │     paths ──► diff del worktree filtrado por paths
        ├── 2. Detectores (solo reportan dentro del scope)
        │     ├── repetido: bloques gemelos dentro del scope
        │     ├── redundante: lógica que ya existe fuera (cita file:line externo)
        │     ├── mal ubicado: contradice mapa de arquitectura / estructura
        │     └── sin uso: sin referencias en el repo (grep de llamadas/imports)
        └── 3. Reporte (formato reviewer: CRITICAL/WARNING/SUGGESTION,
            cap 5 por severidad, file:line, sin pegar diffs)
```

Nuevos assets (único cambio en el repo):
- `skills/fre-review/SKILL.md` — definición de la skill (frontmatter `name: fre-review`, pasos, heurísticas, formato de reporte).
- `commands/fre-review.md` — wrapper `/fre-review` (invoca la skill, declara que el grounding de Work Item es de `@context-resolver`).
- Instalación: reutiliza `installAgentSkills` existente (catálogo + ruteo por host + adapters de frontmatter); ningún cambio en `src/`.

Relación con assets existentes:
- `fre-verify`: verifica artifacts; `fre-review` verifica calidad interna. Sin acoplamiento.
- `agents/reviewer.md`: subagente del orchestrator con Validation Ledger; `fre-review` es invocación directa del usuario con scope declarado. Se reutiliza su formato de reporte y su tope de hallazgos, no su protocolo.

## Validation

- `proposal.md`, `design.md`, `tasks.md` y delta spec coherentes entre sí y con keywords canónicos (`ancleto-fre specs check`).
- Gramática de scope sin ambigüedad abierta (cada forma tiene resolución git definida o pregunta al usuario).
- Cada detector tiene al menos un Scenario en el delta spec con ejemplo de reporte esperado.
- Instalación verificada con `ancleto-fre check` / `ancleto-fre doctor` tras agregar los assets (sin cambios en `src/`, sin dependencias nuevas).
