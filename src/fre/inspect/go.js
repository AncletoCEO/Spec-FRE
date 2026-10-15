// Inspector de binarios Go: buildinfo embebido (versión de compilador y módulos).
// Node puro, sin dependencias.

const GOINF_MAGIC = Buffer.from('\xff Go buildinf:', 'latin1')

export function inspectGo(buf) {
  const idx = buf.indexOf(GOINF_MAGIC)
  if (idx < 0) return null

  const window = buf.toString('latin1', idx, Math.min(buf.length, idx + 8192))
  const vm = window.match(/go1\.\d+(?:\.\d+)?(?:[a-z0-9.]+)?/)

  const modules = readModules(buf)
  return {
    kind: 'go',
    compilerVersion: vm ? vm[0] : null,
    moduleCount: modules.length,
    modules: modules.slice(0, 200)
  }
}

function readModules(buf) {
  const full = buf.toString('latin1')
  const start = full.indexOf('\npath\t')
  if (start < 0) return []
  const block = full.slice(start + 1, start + 65536)
  const cut = block.indexOf('\n\n')
  const body = cut >= 0 ? block.slice(0, cut) : block
  const out = []
  for (const line of body.split('\n')) {
    const parts = line.split('\t')
    const tag = parts[0]
    if (tag === 'path') out.push({ type: 'main', path: parts[1] || '', version: parts[2] || '' })
    else if (tag === 'mod') out.push({ type: 'module', path: parts[1] || '', version: parts[2] || '' })
    else if (tag === 'dep') out.push({ type: 'dep', path: parts[1] || '', version: parts[2] || '' })
  }
  return out
}
