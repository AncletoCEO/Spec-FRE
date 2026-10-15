// Inspector de bytecode EVM: desensamblado de opcodes y recuperación de selectores
// de dispatch (PUSH4 <selector> EQ). Node puro, sin dependencias.

const OPCODES = {
  0x00: 'STOP', 0x01: 'ADD', 0x02: 'MUL', 0x03: 'SUB', 0x04: 'DIV', 0x05: 'SDIV',
  0x06: 'MOD', 0x07: 'SMOD', 0x08: 'ADDMOD', 0x09: 'MULMOD', 0x0a: 'EXP', 0x0b: 'SIGNEXTEND',
  0x10: 'LT', 0x11: 'GT', 0x12: 'SLT', 0x13: 'SGT', 0x14: 'EQ', 0x15: 'ISZERO', 0x16: 'AND',
  0x17: 'OR', 0x18: 'XOR', 0x19: 'NOT', 0x1a: 'BYTE', 0x1b: 'SHL', 0x1c: 'SHR', 0x1d: 'SAR',
  0x20: 'KECCAK256', 0x30: 'ADDRESS', 0x31: 'BALANCE', 0x32: 'ORIGIN', 0x33: 'CALLER',
  0x34: 'CALLVALUE', 0x35: 'CALLDATALOAD', 0x36: 'CALLDATASIZE', 0x37: 'CALLDATACOPY',
  0x38: 'CODESIZE', 0x39: 'CODECOPY', 0x3a: 'GASPRICE', 0x3d: 'RETURNDATASIZE', 0x3e: 'RETURNDATACOPY',
  0x40: 'BLOCKHASH', 0x41: 'COINBASE', 0x42: 'TIMESTAMP', 0x43: 'NUMBER', 0x44: 'PREVRANDAO',
  0x45: 'GASLIMIT', 0x46: 'CHAINID', 0x47: 'SELFBALANCE', 0x48: 'BASEFEE',
  0x50: 'POP', 0x51: 'MLOAD', 0x52: 'MSTORE', 0x53: 'MSTORE8', 0x54: 'SLOAD', 0x55: 'SSTORE',
  0x56: 'JUMP', 0x57: 'JUMPI', 0x58: 'PC', 0x59: 'MSIZE', 0x5a: 'GAS', 0x5b: 'JUMPDEST',
  0x5c: 'TLOAD', 0x5d: 'TSTORE', 0x5e: 'MCOPY', 0x5f: 'PUSH0',
  0x80: 'DUP1', 0x81: 'DUP2', 0x82: 'DUP3', 0x83: 'DUP4', 0x84: 'DUP5',
  0x90: 'SWAP1', 0x91: 'SWAP2', 0x92: 'SWAP3', 0x93: 'SWAP4',
  0xa0: 'LOG0', 0xa1: 'LOG1', 0xa2: 'LOG2', 0xa3: 'LOG3', 0xa4: 'LOG4',
  0xf0: 'CREATE', 0xf1: 'CALL', 0xf2: 'CALLCODE', 0xf3: 'RETURN', 0xf4: 'DELEGATECALL',
  0xf5: 'CREATE2', 0xfa: 'STATICCALL', 0xfd: 'REVERT', 0xfe: 'INVALID', 0xff: 'SELFDESTRUCT'
}

function opName(op) {
  if (op >= 0x60 && op <= 0x7f) return `PUSH${op - 0x5f}`
  return OPCODES[op] || `UNKNOWN_0x${op.toString(16)}`
}

export function inspectEvm(buf) {
  const ops = []
  let pc = 0
  while (pc < buf.length) {
    const op = buf[pc]
    const name = opName(op)
    let operand = null
    if (op >= 0x60 && op <= 0x7f) {
      const n = op - 0x5f
      const bytes = buf.subarray(pc + 1, pc + 1 + n)
      operand = '0x' + bytes.toString('hex')
      ops.push({ pc, op, name, operand, pushSize: n })
      pc += 1 + n
    } else {
      ops.push({ pc, op, name })
      pc += 1
    }
  }

  const selectors = recoverSelectors(buf)
  return {
    kind: 'evm',
    byteLength: buf.length,
    opCount: ops.length,
    disassembly: ops.slice(0, 2000).map((o) => `${o.pc.toString(16).padStart(4, '0')}: ${o.name}${o.operand ? ' ' + o.operand : ''}`),
    selectors
  }
}

function recoverSelectors(buf) {
  const out = []
  let pc = 0
  while (pc < buf.length) {
    const op = buf[pc]
    if (op === 0x63) {
      const sel = buf.subarray(pc + 1, pc + 5)
      if (sel.length === 4 && buf[pc + 5] === 0x14) {
        out.push('0x' + sel.toString('hex'))
      }
      pc += 5
    } else if (op >= 0x60 && op <= 0x7f) {
      pc += 1 + (op - 0x5f)
    } else {
      pc += 1
    }
  }
  return [...new Set(out)]
}
