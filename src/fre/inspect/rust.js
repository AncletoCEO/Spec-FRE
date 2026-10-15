// Inspector de binarios Rust: dependencies embebidas por cargo-auditable.
// El payload vive en una sección `.dep-v0` como JSON comprimido con zlib.
// Node puro (node:zlib), sin dependencias externas.

import { inflateSync } from 'node:zlib'

const ZLIB_HEADERS = new Set([0x789c, 0x7801, 0x78da, 0x785e, 0x78a0, 0x789c])
const MAX_CANDIDATES = 64
const MAX_WINDOW = 8 * 1024 * 1024

export function inspectRust(buf) {
  if (buf.indexOf('.dep-v0') < 0) return null

  const candidates = []
  const limit = Math.min(buf.length - 2, MAX_WINDOW)
  for (let i = 0; i < limit && candidates.length < MAX_CANDIDATES; i++) {
    const h = (buf[i] << 8) | buf[i + 1]
    if (ZLIB_HEADERS.has(h)) candidates.push(i)
  }

  for (const off of candidates) {
    try {
      const inflated = inflateSync(buf.subarray(off, Math.min(buf.length, off + MAX_WINDOW)))
      const text = inflated.toString('utf8')
      const brace = text.indexOf('{')
      if (brace < 0 || !text.includes('packages')) continue
      const data = JSON.parse(text.slice(brace))
      const pkgs = Array.isArray(data.packages) ? data.packages : []
      return {
        kind: 'rust',
        packageCount: pkgs.length,
        packages: pkgs.map((p) => ({ name: p.name, version: p.version, kind: p.kind || 'normal' })).slice(0, 300)
      }
    } catch {
      // no era el stream; seguir
    }
  }
  return { kind: 'rust', packageCount: 0, packages: [] }
}
