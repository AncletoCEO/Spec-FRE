// Carga y validación de perfiles RE (profiles/fre/<clase>/profile.json).
// Node puro, sin dependencias. El schema vive en profiles/fre/profile.schema.json.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const FRE_PROFILES_DIR = join(__dirname, '..', '..', 'profiles', 'fre')

const ID_RE = /^[a-z][a-z0-9-]*$/
const IMPLS = new Set(['native', 'bridge'])

export function profileIds(dir = FRE_PROFILES_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'profile.json')))
    .map((e) => e.name)
    .sort()
}

export function loadProfile(id, dir = FRE_PROFILES_DIR) {
  const p = join(dir, id, 'profile.json')
  if (!existsSync(p)) return null
  const profile = JSON.parse(readFileSync(p, 'utf8'))
  const { valid, errors } = validateProfile(profile)
  return { ...profile, _dir: join(dir, id), _valid: valid, _errors: errors }
}

export function loadProfiles(dir = FRE_PROFILES_DIR) {
  return profileIds(dir).map((id) => loadProfile(id, dir)).filter(Boolean)
}

export function validateProfile(profile) {
  const errors = []
  if (!profile || typeof profile !== 'object') return { valid: false, errors: ['profile must be an object'] }
  if (typeof profile.id !== 'string' || !ID_RE.test(profile.id)) errors.push('id invalido (kebab-case esperado)')
  if (!Array.isArray(profile.targetClasses) || profile.targetClasses.length === 0) errors.push('targetClasses debe ser un array no vacío')
  if (!Array.isArray(profile.capabilities) || profile.capabilities.length === 0) errors.push('capabilities debe ser un array no vacío')
  for (const cap of profile.capabilities || []) {
    if (!cap || typeof cap.id !== 'string') { errors.push('capability sin id'); continue }
    if (!IMPLS.has(cap.impl)) errors.push(`capability ${cap.id}: impl debe ser native|bridge`)
    if (cap.impl === 'bridge' && typeof cap.provider !== 'string') errors.push(`capability ${cap.id}: bridge requiere provider`)
    if (cap.impl === 'native' && cap.provider) errors.push(`capability ${cap.id}: native no debe declarar provider`)
  }
  if (profile.entryCommands && !Array.isArray(profile.entryCommands)) errors.push('entryCommands debe ser un array')
  return { valid: errors.length === 0, errors }
}

// Resuelve la cobertura de una lista de capacidades contra los perfiles instalados.
// Devuelve, por capacidad, native|bridge|missing.
export function capabilityCoverage(requiredIds, profiles) {
  const index = new Map()
  for (const p of profiles) {
    for (const cap of p.capabilities || []) {
      if (!index.has(cap.id) || index.get(cap.id).impl === 'missing') index.set(cap.id, { impl: cap.impl, provider: cap.provider || null, profile: p.id })
    }
  }
  return requiredIds.map((id) => ({ id, ...(index.get(id) || { impl: 'missing', provider: null, profile: null }) }))
}

export function discoverProfileDirs(dir = FRE_PROFILES_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && statSync(join(dir, e.name)).isDirectory())
    .map((e) => e.name)
}
