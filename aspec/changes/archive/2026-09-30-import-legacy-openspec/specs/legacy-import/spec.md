# Spec delta: import-legacy-openspec

## ADDED Requirements

### Requirement: Detección de OpenSpec externo con confirmación

The system SHALL ofrecer la importación cuando detecta un proyecto OpenSpec que nunca usó ancleto-fre.

#### Scenario: Init en proyecto OpenSpec externo

- **WHEN** `ancleto-fre init` se ejecuta donde existe `openspec/changes/` o `openspec/specs/` con archivos y `aspec/` no tiene contenido real
- **THEN** pregunta "Detecté un proyecto OpenSpec. ¿Importar a aspec/?" (default No) y solo importa ante confirmación
- **AND** `openspec/` se conserva intacto como backup con el marcador escrito

### Requirement: Detección en install --project

The system SHALL ejecutar la misma detección en `install --project`.

#### Scenario: Install project sobre OpenSpec externo

- **WHEN** `ancleto-fre install --project` se ejecuta donde existe `openspec/` con contenido
- **THEN** aplica la misma detección e importación que `init` antes del scaffold

### Requirement: Upgrade migratorio sin .ancleto-fre.rc

The system SHALL migrar un proyecto openspec aunque no exista `.ancleto-fre.rc`.

#### Scenario: Upgrade en proyecto openspec virgen

- **WHEN** `ancleto-fre upgrade` se ejecuta sin `.ancleto-fre.rc` donde existe `openspec/` con contenido
- **THEN** ofrece la migración en lugar de exigir "Ejecuta 'ancleto-fre init' primero"
