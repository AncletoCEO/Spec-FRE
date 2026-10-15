// Puente de REFERENCIA (no-op documentado). Fija el contrato y los tests; NO ejecuta
// ningún engine externo (el desensamblado real requiere objdump/rizin/ghidra).
import { registerBridge } from './contract.js'

export function registerReferenceBridge() {
  registerBridge('native-disassemble', (_args, provider) => ({
    noop: true,
    provider,
    result: null,
    note: 'Puente de referencia: invoke no-op. El desensamblado real requiere un engine externo (objdump/rizin/ghidra).'
  }))
}
