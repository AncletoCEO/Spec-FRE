// Entrypoint de inspección de artefactos (núcleo nativo). Clasifica un target y
// despacha al inspector correspondiente. Node puro, sin dependencias externas.

import { readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { detectMagic } from './inspect/magic.js'
import { extractStrings } from './inspect/strings.js'
import { shannonEntropy } from './inspect/entropy.js'
import { inspectElf } from './inspect/elf.js'
import { inspectPe } from './inspect/pe.js'
import { inspectMachO } from './inspect/macho.js'
import { inspectZip } from './inspect/zip.js'
import { inspectGo } from './inspect/go.js'
import { inspectRust } from './inspect/rust.js'
import { inspectWasm } from './inspect/wasm.js'
import { inspectEvm } from './inspect/evm.js'
import { inspectDex } from './inspect/dex.js'
import { inspectAxml } from './inspect/axml.js'
import { inspectDotnet } from './inspect/dotnet.js'
import { inspectPcap } from './inspect/pcap.js'
import { inspectCore } from './inspect/core.js'
import { inspectSqlite } from './inspect/sqlite.js'

export const INSPECTABLE_KINDS = ['elf', 'pe', 'macho', 'macho-fat', 'zip', 'wasm', 'dex', 'axml', 'dotnet', 'pcap', 'core', 'sqlite', 'go', 'rust', 'evm']

export function inspectTarget(target, { type = null, maxStrings = 100 } = {}) {
  const stat = statSync(target)
  const buf = readFileSync(target)
  const magic = detectMagic(buf)
  const kind = type || magic.kind

  const base = {
    path: target,
    size: buf.length,
    isFile: stat.isFile(),
    sha256: createHash('sha256').update(buf).digest('hex'),
    magic,
    detectedKind: magic.kind,
    entropy: Number(shannonEntropy(buf).toFixed(4)),
    strings: extractStrings(buf, { minLength: 6, limit: maxStrings })
  }

  try {
    base.inventory = dispatch(kind, buf, target, magic)
  } catch (err) {
    base.inventory = null
    base.error = err.message
  }
  return base
}

function dispatch(kind, buf, target, magic) {
  switch (kind) {
    case 'elf': {
      if (magic.elfType === 'core') return inspectCore(buf)
      const elf = inspectElf(buf)
      const go = inspectGo(buf)
      if (go) elf.go = go
      const rust = inspectRust(buf)
      if (rust) elf.rust = rust
      return elf
    }
    case 'pe': {
      const pe = inspectPe(buf)
      const dotnet = inspectDotnet(buf)
      if (dotnet) pe.dotnet = dotnet
      const go = inspectGo(buf)
      if (go) pe.go = go
      return pe
    }
    case 'macho':
    case 'macho-fat':
      return inspectMachO(buf)
    case 'zip':
      return inspectZip(buf)
    case 'wasm':
      return inspectWasm(buf)
    case 'dex':
      return inspectDex(buf)
    case 'axml':
      return inspectAxml(buf)
    case 'sqlite':
      return inspectSqlite(target)
    case 'pcap':
      return inspectPcap(buf)
    case 'go':
      return inspectGo(buf)
    case 'rust':
      return inspectRust(buf)
    case 'evm':
      return inspectEvm(buf)
    default: {
      // Sin magic propio: probar heurísticas de marcadores embebidos.
      const dotnet = inspectDotnet(buf)
      if (dotnet) return dotnet
      const go = inspectGo(buf)
      if (go) return go
      const rust = inspectRust(buf)
      if (rust) return rust
      return null
    }
  }
}
