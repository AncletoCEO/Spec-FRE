# Spec delta: fre-core-inspectors

## ADDED Requirements

### Requirement: Inspectores nativos sin dependencias externas

El sistema SHALL proveer inspectores de artefactos implementados en Node puro, usando solo
módulos estándar (`node:sqlite`, `node:zlib`, `node:*`), sin dependencias externas duras. Los
inspectores SHALL ser puros y verificables en aislamiento.

#### Scenario: Inspección sin dependencias

- **WHEN** se invoca el inspector de ELF sobre un binario, en un entorno sin engines externos
- **THEN** devuelve headers, secciones, símbolos e imports
- **AND** no requiere ninguna dependencia externa

### Requirement: Alcance del núcleo (Medium)

El núcleo nativo SHALL cubrir: tipo/magic-bytes/entropía/strings/hashes; contenedores
ZIP/APK/JAR; ELF/PE/Mach-O; Go buildinfo; Rust cargo-auditable; WASM (secciones + decode WAT);
EVM (opcodes + selectores); DEX (desensamblado smali-ish) + AXML; .NET (metadata + decode CIL);
pcap/HAR; core dumps (notas ELF); SQLite. El núcleo NO SHALL incluir decompilación nativa ni
desensamblado de CPU de propósito general (x86/ARM).

#### Scenario: Formato fuera de alcance

- **WHEN** se solicita decompilar una función nativa a pseudocode
- **THEN** el sistema responde que la capacidad está fuera del núcleo y requiere un puente

### Requirement: Contrato de puente opcional

El sistema SHALL exponer un contrato de adaptador para puentes opcionales
(`detect`, `available`, `invoke`). Los puentes SHALL ser opcionales y NUNCA dependencias duras:
la ausencia de un puente NO SHALL impedir el funcionamiento del resto del núcleo.

#### Scenario: Puente no disponible

- **WHEN** un perfil declara una capacidad `bridge` y el provider no está instalado
- **THEN** `available()` no lo lista y el perfil opera sin él

### Requirement: Modo degradado

Cuando falta un puente, el sistema SHALL operar en **modo degradado**: ejecuta lo que el núcleo
nativo cubre y reporta explícitamente las capacidades no cubiertas.

#### Scenario: Reporte de degradación

- **WHEN** un plan requiere Frida (puente) para instrumentación dinámica y no está disponible
- **THEN** el sistema ejecuta la parte estática nativa
- **AND** reporta `degraded: instrumentation requiere provider frida`
