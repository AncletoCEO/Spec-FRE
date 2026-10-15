# Spec delta: fre-orchestrator

## ADDED Requirements

### Requirement: Clasificación determinista del target

El sistema SHALL clasificar un target de ingeniería inversa mediante el preclasificador nativo
(magic bytes, estructuras de contenedor y probing barato), **sin** invocar un LLM, y SHALL
producir una o más clases de target.

#### Scenario: Target binario nativo

- **WHEN** se le entrega un archivo ELF x86-64
- **THEN** el preclasificador devuelve la clase de target `native`
- **AND** no se realiza ninguna llamada a un LLM para la clasificación

#### Scenario: Target APK

- **WHEN** se le entrega un `app.apk`
- **THEN** el preclasificador devuelve la clase de target `mobile`

### Requirement: Composición de perfiles por target × objetivo

El sistema SHALL combinar la clase de target (eje 1) con la capacidad/objetivo inferido de la
tarea (eje 2) para producir un **plan de perfiles** ordenado. Las capacidades transversales
(p.ej. `identify-crypto`, `deobfuscate`) SHALL poder combinarse con cualquier clase de target.

#### Scenario: Plan para extracción de protocolo

- **WHEN** el usuario pregunta "¿cómo firma los requests?" sobre un `app.apk` y el perfil
  `mobile` está instalado
- **THEN** el plan incluye los pasos del perfil `mobile` para `extract-protocol`
- **AND** incorpora la capacidad transversal `identify-crypto` si está disponible

### Requirement: Reporte de cobertura

El sistema SHALL reportar, por cada capacidad requerida, si está cubierta por el núcleo nativo
(`native`), por un puente opcional disponible (`bridge`) o si está `ausente`.

#### Scenario: Capacidad sin puente

- **WHEN** el plan requiere decompilación nativa y no hay puente configurado
- **THEN** el reporte marca esa capacidad como `ausente` y el resto como `native`

### Requirement: GAP como change propuesto

Cuando falta un perfil o una capacidad, el sistema SHALL proponer un change de aspec (un
`proposal.md` mínimo) y NO SHALL instalar ni habilitar el perfil ni el puente por su cuenta.

#### Scenario: Target sin perfil instalado

- **WHEN** se analiza un target de firmware y no existe el perfil `firmware`
- **THEN** el router emite un GAP con un change propuesto ("add profile fre/firmware")
- **AND** no instala el perfil automáticamente

### Requirement: Hand-off al orquestador SDD

El sistema SHALL entregar el plan de perfiles al orquestador SDD existente, que SHALL rutear los
agentes dentro de cada perfil seleccionado.

#### Scenario: Plan entregado

- **WHEN** el router produce un plan con los perfiles `native` y `mobile`
- **THEN** el orquestador recibe el plan y rutea los agentes correspondientes a cada perfil
