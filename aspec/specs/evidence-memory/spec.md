# Spec: evidence-memory

## ADDED Requirements

### Requirement: Registro de finding con provenance obligatoria

El sistema SHALL exponer `recordFinding()` para almacenar hallazgos de ingeniería inversa con
los campos `claim`, `claim_type` (`observation`|`inference`|`hypothesis`), `source`, `tool`,
`confidence`, `unknowns[]` y `target_ref`. El sistema SHALL rechazar cualquier finding que no
incluya `source` y `tool` (provenance obligatoria). Los findings SHALL almacenarse en una tabla
propia, aditiva, sin modificar el schema de `memory_nodes`.

#### Scenario: Finding sin provenance es rechazado

- **WHEN** se invoca `recordFinding()` sin `source` o sin `tool`
- **THEN** el sistema rechaza el registro y reporta el campo faltante
- **AND** no se almacena ningún finding

#### Scenario: Finding válido

- **WHEN** se invoca `recordFinding()` con claim, source, tool, confidence y target_ref
- **THEN** el finding queda almacenado y es recuperable

### Requirement: Recuperación de findings por target

El sistema SHALL exponer `searchFindings()` que recupere findings por búsqueda léxica y que
permita filtrar por `target_ref` y por símbolo/dirección. Los findings NO SHALL inyectarse
proactivamente en el system prompt (recuperación reactiva, como las decisiones).

#### Scenario: Filtro por target

- **WHEN** se invoca `searchFindings({ targetRef })` con el hash de un artefacto
- **THEN** solo se devuelven los findings cuyo `target_ref` coincide

#### Scenario: Sin inyección proactiva

- **WHEN** se construye el bloque de contexto del orquestador
- **THEN** el bloque NO incluye findings

### Requirement: Invalidación por hash de target_ref

El sistema SHALL atar cada finding al hash del artefacto analizado (`target_ref`). Si el target
actual no coincide con el `target_ref` de un finding, el sistema SHALL marcarlo `stale` y NO
SHALL presentarlo como vigente.

#### Scenario: Target cambió

- **WHEN** existe un finding con `target_ref=H1` y se analiza el mismo artefacto con hash `H2`
- **THEN** el finding se marca `stale`
- **AND** no se presenta como evidencia vigente

### Requirement: Promoción de finding a rule/decision

Un finding estable SHALL poder promoverse a `rule` o `decision` mediante las herramientas de
memoria existentes, sin cambiar la firma de `recordRule`/`recordDecision`.

#### Scenario: Promoción de un hallazgo estable

- **WHEN** un finding se considera estable y general
- **THEN** el usuario puede registrarlo como `rule` o `decision` con las tools existentes
