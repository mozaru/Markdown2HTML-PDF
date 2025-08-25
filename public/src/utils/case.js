// src/utils/case.js
// Transformações de texto para TITLE, conforme modos definidos no projeto.
//
// Modos suportados (keys esperadas pelo TemplateService.normalizeCaseToken):
// - 'camel'            → camelCase
// - 'pascal'           → PascalCase
// - 'snake'            → snake_case
// - 'kebab'            → kebab-case
// - 'scream_snake'     → SCREAMING_SNAKE_CASE
// - 'scream_kebab'     → SCREAMING-KEBAB-CASE
// - 'train'            → Train-Case
// - 'flat'             → flatcase
// - 'upper_flat'       → UPPERFLATCASE
// - 'camel_snake'      → camel_Snake_Case   (primeira minúscula, separador '_')
// - 'pascal_snake'     → Pascal_Snake_Case  (todas capitalizadas, separador '_')
// - 'scream_words'     → SCREAMING CASE     (espaço entre palavras)
// - 'upper'            → UPPERCASE
// - 'lower'            → lowercase
//
// Observações:
// - Removemos acentos/diacríticos para estabilidade (NFD).
// - Tokenização divide por caracteres não alfanuméricos e também respeita quebras camelCase/ACRONYMword.
// - Dígitos são mantidos como tokens próprios e preservados.

function deburr(str='') {
  // Remove diacríticos (acentos) via Normalization Form Decomposition
  try {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } catch {
    return String(str);
  }
}

function splitCamelAndAcronyms(s='') {
  // Insere espaços entre camelCase e fronteiras de acrônimos
  // 'APIResponse' -> 'API Response'; 'userIDValue' -> 'user ID Value'
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function tokenize(input='') {
  const s = splitCamelAndAcronyms(deburr(input));
  // Separa por qualquer não-alfanumérico
  const rough = s.split(/[^A-Za-z0-9]+/).filter(Boolean);
  // Normaliza cada token removendo espaços residuais
  return rough.map(t => t.trim()).filter(Boolean);
}

function capFirst(w='') {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

function toCamel(tokens) {
  if (!tokens.length) return '';
  const [first, ...rest] = tokens;
  return first.toLowerCase() + rest.map(capFirst).join('');
}

function toPascal(tokens) {
  return tokens.map(capFirst).join('');
}

function toSnake(tokens) {
  return tokens.map(t => t.toLowerCase()).join('_');
}

function toKebab(tokens) {
  return tokens.map(t => t.toLowerCase()).join('-');
}

function toScreamSnake(tokens) {
  return tokens.map(t => t.toUpperCase()).join('_');
}

function toScreamKebab(tokens) {
  return tokens.map(t => t.toUpperCase()).join('-');
}

function toTrain(tokens) {
  // Cada palavra Capitalizada, separadas por '-'
  return tokens.map(capFirst).join('-');
}

function toFlat(tokens) {
  return tokens.map(t => t.toLowerCase()).join('');
}

function toUpperFlat(tokens) {
  return tokens.map(t => t.toUpperCase()).join('');
}

function toCamelSnake(tokens) {
  if (!tokens.length) return '';
  const [first, ...rest] = tokens;
  return first.toLowerCase() + (rest.length ? '_' + rest.map(capFirst).join('_') : '');
}

function toPascalSnake(tokens) {
  return tokens.map(capFirst).join('_');
}

function toScreamWords(tokens) {
  return tokens.map(t => t.toUpperCase()).join(' ');
}

/**
 * Transforma texto segundo o modo especificado.
 * @param {string} text
 * @param {string} mode - ver lista acima
 * @returns {string}
 */
export function transformCase(text = '', mode = 'lower') {
  const tokens = tokenize(text);
  switch (mode) {
    case 'camel':          return toCamel(tokens);
    case 'pascal':         return toPascal(tokens);
    case 'snake':          return toSnake(tokens);
    case 'kebab':          return toKebab(tokens);
    case 'scream_snake':   return toScreamSnake(tokens);
    case 'scream_kebab':   return toScreamKebab(tokens);
    case 'train':          return toTrain(tokens);
    case 'flat':           return toFlat(tokens);
    case 'upper_flat':     return toUpperFlat(tokens);
    case 'camel_snake':    return toCamelSnake(tokens);
    case 'pascal_snake':   return toPascalSnake(tokens);
    case 'scream_words':   return toScreamWords(tokens);
    case 'upper':          return deburr(text).toUpperCase();
    case 'lower':          return deburr(text).toLowerCase();
    default:               return tokens.join(' '); // fallback seguro
  }
}

export default { transformCase };
