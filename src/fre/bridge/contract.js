// Contrato de puentes opcionales para capacidades que el núcleo nativo no cubre
// (decompilación, instrumentación dinámica, dispositivos, navegador, ...).
// Principio: los puentes son OPCIONALES y NUNCA dependencias duras; sin provider
// disponible, el perfil opera DEGRADADO. Node puro, sin dependencias.

import { spawnSync } from 'node:child_process'

// Provider -> binario + capacidades que habilita.
export const BRIDGE_PROVIDERS = {
  ghidra: { binary: 'ghidra', capabilities: ['native-decompile'] },
  ida: { binary: 'ida64', capabilities: ['native-decompile'] },
  hopper: { binary: 'hopper', capabilities: ['native-decompile'] },
  objdump: { binary: 'objdump', capabilities: ['native-disassemble'] },
  rizin: { binary: 'rizin', capabilities: ['native-disassemble'] },
  frida: { binary: 'frida', capabilities: ['dynamic-instrumentation'] },
  adb: { binary: 'adb', capabilities: ['device-access'] },
  jadx: { binary: 'jadx', capabilities: ['full-java-decompile'] },
  chrome: { binary: 'google-chrome', capabilities: ['headless-browser'] },
  binwalk: { binary: 'binwalk', capabilities: ['firmware-extract'] }
}

export const DEGRADED = Object.freeze({ degraded: true })

function which(binary) {
  try {
    const r = process.platform === 'win32'
      ? spawnSync('where', [binary], { stdio: 'ignore' })
      : spawnSync('sh', ['-c', `command -v ${binary}`], { stdio: 'ignore' })
    return r.status === 0
  } catch {
    return false
  }
}

// detect(provider) -> boolean
export function detect(provider) {
  const def = BRIDGE_PROVIDERS[provider]
  if (!def) return false
  return which(def.binary)
}

// available() -> [{ id, provider, capabilities, binary }]
export function available() {
  return Object.entries(BRIDGE_PROVIDERS)
    .filter(([id]) => detect(id))
    .map(([id, def]) => ({ id, provider: id, capabilities: def.capabilities, binary: def.binary }))
}

// capabilityProvider(capability) -> provider id | null (primer provider que la habilita)
export function capabilityProvider(capability) {
  for (const [id, def] of Object.entries(BRIDGE_PROVIDERS)) {
    if (def.capabilities.includes(capability)) return id
  }
  return null
}

// Registro de puentes concretos. La implementación por defecto es un no-op
// DOCUMENTADO: reconoce la capacidad y el provider, pero no ejecuta análisis real
// (no reimplementamos Ghidra/Frida/jadx). Un puente real se registra aquí.
const bridges = new Map()

export function registerBridge(capability, impl) {
  bridges.set(capability, impl)
}

// invoke(capability, args, { provider }) -> { degraded, ... } | result del puente
export function invoke(capability, args = {}, { provider = null } = {}) {
  const prov = provider || capabilityProvider(capability)
  if (!prov || !detect(prov)) {
    return { ...DEGRADED, capability, provider: prov || null, reason: 'provider no disponible' }
  }
  const impl = bridges.get(capability)
  if (impl) {
    return { degraded: false, capability, provider: prov, ...impl(args, prov) }
  }
  // Puente de referencia: reconocido pero no-op documentado.
  return {
    degraded: false,
    noop: true,
    capability,
    provider: prov,
    result: null,
    note: 'puente de referencia: capacidad reconocida, invoke no-op (no se ejecuta el engine externo)'
  }
}

// Enriquecer un reporte de cobertura: para cada capacidad `bridge`, distinguir si
// el provider está disponible o si el perfil operará degradado.
export function bridgeStatus(capability, provider) {
  if (provider && detect(provider)) return { impl: 'bridge', provider, available: true }
  return { impl: 'bridge', provider: provider || capabilityProvider(capability), available: false }
}
