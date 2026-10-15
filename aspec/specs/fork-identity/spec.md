# Spec: fork-identity

## ADDED Requirements

### Requirement: Identidad total del fork

El sistema SHALL ser una herramienta aparte de ancleto, sin alias. SHALL renombrar, según el mapa
del proposal §1.1: binario → `ancleto-fre`; paquete npm → `@ancleto/spec-fre`; comandos slash →
`/fre-*` (`commands/fre-*.md`); skills → `fre-*` (excepto `triage-clarifier`); storage →
`.ancleto-fre/`; config de proyecto → `.ancleto-fre.rc`; servidor MCP → `ancleto-fre-memory`;
variables de entorno → `ANCLETO_FRE_*`; config global → `~/.config/ancleto-fre/`. Los nombres de
tools MCP (`searchMemory`/`recordRule`/`recordDecision`) y los agentes (`agents/*.md`) NO SHALL
renombrarse.

#### Scenario: Invocación del binario

- **WHEN** el usuario ejecuta `ancleto-fre install`
- **THEN** el comando funciona y la ayuda muestra `ancleto-fre`

#### Scenario: Storage y comandos renombrados

- **WHEN** se instala el fork
- **THEN** la base de memoria vive en `.ancleto-fre/memory.db` y la config en `.ancleto-fre.rc`
- **AND** los comandos del ciclo son `/fre-*`

#### Scenario: Sin referencias colgantes

- **WHEN** se completa el sweep de identidad
- **THEN** ninguna skill/command invoca `ancleto` ni lee `.ancleto/`/`.ancletorc`

### Requirement: Naming FRE

El sistema SHALL documentar que `FRE` = *For Reverse Engineering* (Spec-FRE = Spec For Reverse
Engineering) en README, descripciones y metadatos del paquete.

#### Scenario: Expansión del acrónimo

- **WHEN** el usuario lee el README o la descripción del paquete
- **THEN** `FRE` se explica como *For Reverse Engineering*

### Requirement: Banner de instalación

El banner de `ancleto-fre install` SHALL conservar la taza original (`CUP`) y cambiar **solo el
texto en bloque**, de `ANCLETO` a `ANCLETO-FRE`. SHALL conservar las paletas y el efecto de onda, y
`TEXT_START` SHALL mantenerse (el alto de `CUP` no cambia).

#### Scenario: Banner con wordmark del fork

- **WHEN** se ejecuta `ancleto-fre install`
- **THEN** se muestra la taza original
- **AND** el texto en bloque dice `ANCLETO-FRE`

### Requirement: Instalación sin tiers ni Azure

El flujo de instalación SHALL pedir solo `agent → lang (→ exclude)`. El sistema NO SHALL
preguntar por tier ni por Azure, NO SHALL escribir `tier`, `azure` ni `gratisModel` en
`.ancleto-fre.rc`, y NO SHALL exponer `--tier`, `--with-azure` ni `ANCLETO_MUSE_SPARK`.

#### Scenario: Instalación simplificada

- **WHEN** se ejecuta `ancleto-fre install`
- **THEN** no se pregunta por tier ni por Azure
- **AND** el `.ancleto-fre.rc` resultante no contiene `tier`, `azure` ni `gratisModel`

### Requirement: Paridad de LLMs

El sistema SHALL mantener el mismo conjunto de `model` ids por agente y los mismos 8 hosts que el
upstream. El modelo NO SHALL elegirse por tier: cada agente SHALL usar un default fijo,
configurable en `.ancleto-fre.rc → models` sin preguntar.

#### Scenario: Default fijo por agente

- **WHEN** se instala sin configurar `models`
- **THEN** cada agente usa su `model` default (el del anterior tier `normal`)

#### Scenario: Configuración sin preguntas

- **WHEN** el usuario define `models` en `.ancleto-fre.rc`
- **THEN** el instalador los respeta sin preguntar

### Requirement: README multi-idioma

El sistema SHALL documentar el proyecto con un `README.md` en el idioma primario (es) y
traducciones en `docs/readme/README_<lang>.md`, con una línea selectora de idioma al tope de cada
archivo. Los nombres de archivos y directorios y los keywords de artifacts NO SHALL traducirse.

#### Scenario: Selector de idioma

- **WHEN** el usuario abre `README.md`
- **THEN** encuentra links a las versiones en `docs/readme/README_<lang>.md`
- **AND** cada versión tiene el selector al tope

### Requirement: Limpieza del seed sin pérdida de contexto

El sistema NO SHALL borrar el seed técnico (`.discovery-map.json`, `docs/technical-discovery/**`)
sin regenerarlo. La regeneración SHALL producir un seed que describa al fork (no al upstream).

#### Scenario: Seed regenerado

- **WHEN** se ejecuta `ancleto-fre discovery --check` tras la limpieza
- **THEN** el estado reportado es `READY`
- **AND** el seed describe la identidad y los ejes del fork
