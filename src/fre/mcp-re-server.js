// Servidor MCP de ingeniería inversa: inspectores nativos + memoria de evidencia.
// Node puro, JSON-RPC por stdio (una línea por mensaje).

import { inspectTarget } from './re-inventory.js'
import { createMemoryEngine, defaultMemoryDbPath } from '../core/memory/engine.js'

const PROTOCOL_VERSION = '2024-11-05'
const SERVER_INFO = { name: 'ancleto-fre-re', version: '0.1.0' }

export const reTools = [
  {
    name: 'inspect_target',
    description:
      'Inspecciona un artefacto de ingeniería inversa (binario ELF/PE/Mach-O, APK/ZIP, WASM, EVM, DEX, AXML, .NET, pcap, core dump, SQLite, Go/Rust) y devuelve su inventario nativo. Todo el análisis es local y sin dependencias externas.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta absoluta del artefacto a inspeccionar.' },
        type: { type: 'string', description: 'Forzar el tipo de target (opcional).' }
      },
      required: ['path']
    }
  },
  {
    name: 'record_finding',
    description:
      'Registra un hallazgo de ingeniería inversa con provenance OBLIGATORIA (source + tool). Los hallazgos quedan atados al hash del artefacto (target_ref).',
    inputSchema: {
      type: 'object',
      properties: {
        memory_key: { type: 'string', description: 'Clave conceptual estable (ej. "apk/token-signing").' },
        claim: { type: 'string', description: 'El hallazgo.' },
        claim_type: { type: 'string', enum: ['observation', 'inference', 'hypothesis'] },
        source: { type: 'string', description: 'De dónde salió (file:offset, símbolo, tool-call). Obligatorio.' },
        tool: { type: 'string', description: 'Herramienta que lo produjo (ej. elf-inspector). Obligatorio.' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        unknowns: { type: 'array', items: { type: 'string' }, description: 'Lo que NO se pudo determinar.' },
        target_ref: { type: 'string', description: 'Hash del artefacto analizado. Obligatorio.' },
        scope: { type: 'string', enum: ['project', 'feature', 'task'] }
      },
      required: ['memory_key', 'claim', 'source', 'tool', 'target_ref']
    }
  },
  {
    name: 'search_findings',
    description: 'Busca hallazgos de RE por texto y/o por target_ref. Excluye los stale por defecto.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        targetRef: { type: 'string' },
        status: { type: 'string', enum: ['active', 'stale'] },
        limit: { type: 'integer', minimum: 1, maximum: 50 }
      }
    }
  }
]

export function createReServer({ dbPath = defaultMemoryDbPath() } = {}) {
  let engine = null
  const toolkit = () => {
    if (!engine) engine = createMemoryEngine(dbPath)
    return engine
  }

  const respond = (id, result) => ({ jsonrpc: '2.0', id, result })
  const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } })

  function handle(message) {
    if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') return null
    const { id, method, params } = message
    if (typeof method === 'string' && method.startsWith('notifications/')) return null
    if (id === undefined || id === null) return null

    switch (method) {
      case 'initialize':
        return respond(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO })
      case 'ping':
        return respond(id, {})
      case 'tools/list':
        return respond(id, { tools: reTools })
      case 'tools/call': {
        const name = params && params.name
        const args = (params && params.arguments) || {}
        try {
          let result
          if (name === 'inspect_target') result = inspectTarget(args.path, { type: args.type || null })
          else if (name === 'record_finding') result = toolkit().recordFinding(args)
          else if (name === 'search_findings') result = toolkit().searchFindings(args)
          else return fail(id, -32602, `tool desconocida: ${name}`)
          return respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
        } catch (err) {
          return respond(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true })
        }
      }
      default:
        return fail(id, -32601, `metodo no soportado: ${method}`)
    }
  }

  function close() {
    if (engine) { engine.checkpoint(); engine.close(); engine = null }
  }

  return { handle, close, dbPath }
}

export async function serveReMcp({ dbPath = defaultMemoryDbPath(), input = process.stdin, output = process.stdout } = {}) {
  const server = createReServer({ dbPath })
  const write = (obj) => output.write(JSON.stringify(obj) + '\n')

  input.setEncoding('utf8')
  let buffer = ''
  input.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const text = line.trim()
      if (!text) continue
      let message
      try {
        message = JSON.parse(text)
      } catch {
        write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON invalido' } })
        continue
      }
      const response = server.handle(message)
      if (response) write(response)
    }
  })
  input.on('end', () => server.close())
}
