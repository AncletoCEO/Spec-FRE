// FRE Router (parte determinista): clasifica un target con el núcleo nativo,
// compone la cobertura de capacidades contra los perfiles instalados y reporta
// GAPs. La clasificación del objetivo (LLM) la aporta el agente `re-router`.
// Node puro, sin dependencias.

import { openSync, readSync, closeSync } from 'node:fs'
import { detectMagic } from './inspect/magic.js'
import { loadProfiles, capabilityCoverage } from './profiles.js'

// Objetivo (eje 2) -> capacidades requeridas (ids de perfil).
export const OBJECTIVE_CAPABILITIES = {
  'understand-behavior': ['file-magic', 'strings', 'elf-symbols', 'pe-imports'],
  'reconstruct-algorithm': ['file-magic', 'strings', 'elf-symbols', 'native-decompile'],
  'extract-protocol': ['strings', 'pe-imports', 'endpoint'],
  'identify-crypto': ['strings', 'entropy'],
  'deobfuscate': ['strings', 'entropy', 'native-decompile'],
  'recover-format': ['file-magic', 'strings', 'entropy'],
  'recover-manifest': ['zip-container', 'axml-manifest'],
  'audit-permissions': ['zip-container', 'axml-manifest', 'permission']
}

export function classifyTarget(target) {
  const fd = openSync(target, 'r')
  try {
    const buf = Buffer.alloc(4096)
    const n = readSync(fd, buf, 0, 4096, 0)
    return detectMagic(buf.subarray(0, n))
  } finally {
    closeSync(fd)
  }
}

export function capabilitiesForObjective(objective) {
  return OBJECTIVE_CAPABILITIES[objective] || []
}

// Compone el plan para un target y un objetivo dados.
export function route(target, objective, { capabilities = null, profiles = loadProfiles() } = {}) {
  const magic = classifyTarget(target)
  const required = capabilities || capabilitiesForObjective(objective)
  const matchedProfiles = profiles.filter((p) => (p.targetClasses || []).includes(magic.kind))
  const pool = matchedProfiles.length ? matchedProfiles : profiles
  const coverage = capabilityCoverage(required, pool)
  const gaps = coverage.filter((c) => c.impl === 'missing').map((c) => c.id)
  const bridges = coverage.filter((c) => c.impl === 'bridge')

  return {
    target,
    kind: magic.kind,
    description: magic.description,
    objective: objective || null,
    requiredCapabilities: required,
    matchedProfiles: matchedProfiles.map((p) => p.id),
    coverage,
    gaps,
    degraded: bridges.map((c) => ({ id: c.id, provider: c.provider })),
    needsGapChange: gaps.length > 0
  }
}

// Genera un proposal.md mínimo para cubrir un GAP (no instala nada).
export function gapProposal(plan) {
  if (!plan.needsGapChange) return null
  const name = `add-re-capability-${plan.gaps.join('-')}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const body = `# Proposal: cubrir capacidades de RE faltantes (${plan.gaps.join(', ')})

## Problem

Al rutear el target \`${plan.target}\` (clase \`${plan.kind}\`) para el objetivo
\`${plan.objective || 'sin objetivo'}\`, faltan capacidades que ningún perfil instalado cubre:
${plan.gaps.map((g) => `- \`${g}\``).join('\n')}

## Proposed change

Agregar la(s) capacidad(es) faltante(s), ya sea como inspector del núcleo nativo o como puente
opcional declarado en un \`profile.json\`.

## Scope

In scope: declarar/implementar las capacidades faltantes.
Out of scope: instalar puentes automáticamente.

## Risks

- **Capacidad fantasma**: proponer algo no implementable. Mitigación: el GAP se revisa antes de crear.
`
  return { name, path: `aspec/changes/${name}/proposal.md`, content: body }
}
