# Spec delta: antigravity-support

## RENAMED Requirements

- FROM: `### Requirement: Integración de \`check\` y tier sin acoplamiento a \`.opencode/*\``
- TO: `### Requirement: Integración de \`check\` sin acoplamiento a \`.opencode/*\``

## MODIFIED Requirements

### Requirement: Integración de `check` sin acoplamiento a `.opencode/*`

Para un proyecto `antigravity`, `ancleto check` SHALL reconocer el layout (`.agents/skills`,
`.agents/agents`) sin reportar faltantes ni huérfanos falsos. El conjunto esperado de cada directorio SHALL
derivarse de la **unión de los hosts realmente instalados** (leída del manifiesto/`installedPaths`), NO de un
único `rc.agent`: para `.agents/skills`, SHALL incluir el catálogo de skills **y** los command-skills
derivados de `commands/*`. Esto evita reportar huérfanos falsos cuando varios hosts conviven en el mismo
proyecto. El estado `scoped`/global del proyecto SHALL derivarse de los directorios de agents realmente
instalados del host, NO de `.opencode/agents` fijo.

#### Scenario: `check` valida el layout de `antigravity` sin falsos positivos

- **WHEN** se instala con `agent: antigravity` y luego se ejecuta `ancleto check`
- **THEN** el comando reporta `0 faltantes` y `0 huerfanos`
- **AND** reconoce `.agents/skills` y `.agents/agents` como instalados

#### Scenario: Un proyecto `antigravity` con agents locales es `scoped`

- **WHEN** un proyecto `.ancleto-fre.rc` con `agent: antigravity` tiene `.agents/agents` poblado
- **THEN** el proyecto SHALL figurar como `scoped` en `ancleto projects list`

### Requirement: Política de `model` de los agents de `antigravity`

El CLI NO SHALL mapear el catálogo de modelos de opencode a un alias de Antigravity: no existe una
equivalencia verificada. Los agents de `antigravity` SHALL declarar `model: inherit`.

#### Scenario: `model` queda en `inherit`

- **WHEN** se instala con `agent: antigravity`
- **THEN** los agents instalados declaran `model: inherit`
- **AND** NO contienen un identificador de modelo de `opencode-go`
