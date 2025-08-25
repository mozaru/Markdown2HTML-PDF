// src/utils/number.js
// Máscara numérica para PAGE/PAGES conforme especificação:
// - '0' → preenche com zero se não houver dígito; caso haja, usa o dígito
// - '_' → preenche com '_' se não houver dígito; caso haja, usa o dígito
// - '9' → preenche com espaço se não houver dígito; caso haja, usa o dígito
// - '#' → se faltar dígito, não preenche nada; se houver, usa o dígito
// - Qualquer outro caractere → literal
//
// Alinhamento: direita → aplicamos a máscara da direita para a esquerda;
// dígitos excedentes (mais que a máscara) são mantidos à esquerda do resultado.
// Suporte a sinal negativo: prefixado antes do resultado final.
// Apenas inteiros são suportados (PAGE/PAGES).
//
// Exemplos:
//   formatNumberWithMask(7, "0000")   -> "0007"
//   formatNumberWithMask(7, "####")   -> "7"
//   formatNumberWithMask(7, "9999")   -> "   7"
//   formatNumberWithMask(7, "____")   -> "___7"
//   formatNumberWithMask(123, "00-00")-> "1-23"
//   formatNumberWithMask(12345, "0000")-> "12345" (excedentes mantidos à esquerda)
//   formatNumberWithMask(-12, "0#0#") -> "-1 2"
//
// Se mask for vazia/undefined, retorna o número como string.

/**
 * Formata um número inteiro com uma máscara alinhada à direita.
 * @param {number|string} value - valor numérico (inteiro). Strings serão parseadas.
 * @param {string} [mask] - máscara conforme regras acima.
 * @returns {string}
 */
export function formatNumberWithMask(value, mask) {
  const n = Number(value);
  const isNeg = isFinite(n) && n < 0;
  const abs = isFinite(n) ? Math.trunc(Math.abs(n)) : 0;
  const digits = String(abs);
  const m = String(mask || '');

  if (!m) return (isNeg ? '-' : '') + digits;

  let res = '';
  let di = digits.length - 1;

  for (let mi = m.length - 1; mi >= 0; mi--) {
    const ch = m[mi];
    if (ch === '0' || ch === '_' || ch === '9' || ch === '#') {
      if (di >= 0) {
        res = digits[di] + res;
        di--;
      } else {
        if (ch === '0') res = '0' + res;
        else if (ch === '_') res = '_' + res;
        else if (ch === '9') res = ' ' + res;
        else if (ch === '#') res = '' + res;
      }
    } else {
      // literal
      res = ch + res;
    }
  }

  // Sobras de dígitos (se número tiver mais dígitos que a máscara)
  if (di >= 0) {
    res = digits.slice(0, di + 1) + res;
  }

  return (isNeg ? '-' : '') + res;
}

export default { formatNumberWithMask };
