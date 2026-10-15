# Spec delta: commandcode-support

## MODIFIED Requirements

### Requirement: Nota de modelo de `commandcode`

El CLI SHALL anexar al agent `orchestrator` instalado para `commandcode` una nota que indique que
en este host el `model` se hereda de la sesión y se elige con `/model`. La nota NO SHALL
aplicarse a otros agents ni a otros hosts.

#### Scenario: El orchestrator de `commandcode` lleva la nota

- **WHEN** se instala con `agent: commandcode`
- **THEN** `.commandcode/agents/orchestrator.md` incluye la nota de modelo de Command Code
- **AND** los demás agents no la incluyen
