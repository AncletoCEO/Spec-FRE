# Spec delta: project-portability

## MODIFIED Requirements

### Requirement: Export portable sin rutas absolutas

The system SHALL generar un bundle portable cuyo manifiesto no contenga paths absolutos ni secretos.

#### Scenario: Export en máquina origen

- **WHEN** se ejecuta `ancleto export`
- **THEN** se genera el bundle con `manifest.json` (versión, agente, idioma, flags, MCP por nombre+tipo)
- **AND** el manifiesto NO contiene el campo `tier` (el eje no existe en el fork)
- **AND** el manifiesto no contiene paths absolutos, credenciales ni datos de sesión
