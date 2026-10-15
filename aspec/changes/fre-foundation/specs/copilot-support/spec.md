# Spec delta: copilot-support

## MODIFIED Requirements

### Requirement: Documentación de la limitación de modelos

The system SHALL documentar que en Copilot el modelo se elige en el picker del host, y que el
sistema NO posee un mecanismo de tiers.

#### Scenario: Usuario consulta la elección de modelo con Copilot

- **WHEN** el usuario instala con `--agent copilot`
- **THEN** la guía explica que el modelo se elige en el picker del host
- **AND** no se menciona ningún tier ni el flag `--tier`
