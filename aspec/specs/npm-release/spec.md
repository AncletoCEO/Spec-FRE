# Spec: npm-release

## ADDED Requirements

### Requirement: Paquete npm creado de cero

El sistema SHALL publicarse como el paquete npm **nuevo** `@ancleto/spec-fre`, con
`publishConfig.access: public`, `files` acotado, `engines.node >= 24` y `license: MIT`. El
paquete NO SHALL continuar la numeración de `@ancleto/spec`; su primera versión SHALL ser `0.1.0`.

#### Scenario: Identidad del paquete publicado

- **WHEN** se inspecciona el paquete publicado
- **THEN** su `name` es `@ancleto/spec-fre` y su primera versión es `0.1.0`

### Requirement: Versionado SemVer con tags (paridad con el upstream)

El sistema SHALL versionarse con SemVer donde `package.json.version` es la fuente de verdad, cada
release se marca con un tag `vX.Y.Z` y `CHANGELOG.md` se actualiza en el mismo release. El sistema
NO SHALL depender de herramientas de release automáticas (release-please, semantic-release).

#### Scenario: Coherencia de versión y tag

- **WHEN** se corta un release
- **THEN** el tag `vX.Y.Z`, `package.json.version` y la entrada del `CHANGELOG` coinciden
- **AND** no se usa ninguna herramienta de release automática

### Requirement: Publicación disparada por tag

El sistema SHALL publicar a npm mediante un workflow de CI disparado por tags `v*` que ejecuta
`npm ci`, `lint` y tests, publica la versión solo si aún no existe, y crea el GitHub Release del
tag. El workflow SHALL verificar el tarball publicado contra el paquete `@ancleto/spec-fre`.

#### Scenario: Push de un tag publica

- **WHEN** se empuja un tag `vX.Y.Z` y esa versión no existe en npm
- **THEN** el workflow corre lint y tests, publica `@ancleto/spec-fre@X.Y.Z` y crea el Release

#### Scenario: Versión ya publicada se omite

- **WHEN** la versión del tag ya existe en npm
- **THEN** el workflow omite `npm publish` sin fallar

### Requirement: Publicación por Trusted Publishing (OIDC)

El workflow de publicación SHALL autenticarse contra npm mediante **Trusted Publishing** (OIDC)
con `permissions: id-token: write` y `--provenance`, SIN usar un `NPM_TOKEN` de larga vida. El
paquete SHALL tener configurado su Trusted Publisher en npm.

#### Scenario: Publish sin token

- **WHEN** el workflow publica desde GitHub Actions con `id-token: write`
- **THEN** npm autentica por OIDC y publica con atestación de provenance
- **AND** no se usa ningún `NPM_TOKEN`

### Requirement: Verificación del artefacto publicado

El sistema SHALL poder verificarse tras publicar: `npm view @ancleto/spec-fre version` SHALL
responder, y una instalación global SHALL exponer el binario `ancleto-fre`.

#### Scenario: Instalación desde npm

- **WHEN** se ejecuta `npm i -g @ancleto/spec-fre` y luego `ancleto-fre --version`
- **THEN** el binario responde con la versión publicada
