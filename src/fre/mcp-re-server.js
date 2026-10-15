// Servidor MCP de ingeniería inversa (núcleo nativo). Expone `inspect_target`.
// Node puro, protocolo JSON-RPC por stdio (una línea por mensaje).

import { inspectTarget } from './re-inventory.js'

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
  }
]

export function createReServer() {
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
        if (name !== 'inspect_target') return fail(id, -32602, `tool desconocida: ${name}`)
        try {
          const result = inspectTarget(args.path, { type: args.type || null })
          return respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
        } catch (err) {
          return respond(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true })
        }
      }
      default:
        return fail(id, -32601, `metodo no soportado: ${method}`)
    }
  }

  return { handle }
}

export async function serveReMcp({ input = process.stdin, output = process.stdout } = {}) {
  const server = createReServer()
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
}
