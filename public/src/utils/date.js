// src/utils/date.js
// Formatadores simples de data e hora conforme padrões definidos:
// Data: d, dd, ddd, m, mm, mmm, y, yy, yyyy
// Hora: h, hh, H, HH, m, mm, s, ss + AM/PM
//
// Observação importante:
// - Em formatDate(), `mm` sempre significa **mês** (01-12).
// - Em formatTime(), `mm` sempre significa **minuto** (00-59).
// - `ddd` retorna o dia da semana abreviado em pt-BR (dom, seg, ter, qua, qui, sex, sáb).
// - `mmm` retorna o mês abreviado em pt-BR (jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez).

const WEEKDAYS_SHORT = ['dom','seg','ter','qua','qui','sex','sáb'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function pad(n, len = 2, ch = '0') {
  const s = String(Math.trunc(Math.abs(n)));
  if (s.length >= len) return s;
  return ch.repeat(len - s.length) + s;
}

function two(n) { return pad(n, 2, '0'); }

/**
 * Formata uma data conforme pattern dado.
 * Tokens suportados: d, dd, ddd, m, mm, mmm, y, yy, yyyy
 * @param {Date} date
 * @param {string} pattern
 * @returns {string}
 */
export function formatDate(date, pattern = 'dd/mm/yyyy') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';

  const day = d.getDate();              // 1-31
  const dow = d.getDay();               // 0-6 (0=dom)
  const month = d.getMonth() + 1;       // 1-12
  const year = d.getFullYear();         // 4 dígitos

  // Substituições em ordem que evita conflitos (yyyy antes de yy, mm antes de m, etc.)
  let out = String(pattern);

  // Dia da semana abreviado
  out = out.replace(/ddd/g, WEEKDAYS_SHORT[dow]);

  // Ano (yyyy, yy, y)
  out = out.replace(/yyyy/g, String(year));
  out = out.replace(/yy/g, String(year).slice(-2));
  out = out.replace(/y/g, String(year)); // fallback: igual a yyyy

  // Mês (mmm, mm, m)
  out = out.replace(/mmm/g, MONTHS_SHORT[month - 1]);
  out = out.replace(/mm/g, two(month));
  out = out.replace(/\bm\b/g, String(month)); // \b evita substituir o m do "mmm" já tratado

  // Dia (dd, d)
  out = out.replace(/dd/g, two(day));
  out = out.replace(/\bd\b/g, String(day));

  return out;
}

/**
 * Formata um horário conforme pattern dado.
 * Tokens suportados: h, hh, H, HH, m, mm, s, ss e AM/PM (ou am/pm)
 * @param {Date} date
 * @param {string} pattern
 * @returns {string}
 */
export function formatTime(date, pattern = 'HH:mm') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';

  const H24 = d.getHours();             // 0-23
  const h12 = ((H24 + 11) % 12) + 1;    // 1-12
  const m = d.getMinutes();
  const s = d.getSeconds();
  const isPM = H24 >= 12;

  let out = String(pattern);

  // AM/PM markers
  out = out.replace(/AM\/PM/g, isPM ? 'PM' : 'AM');
  out = out.replace(/am\/pm/g, isPM ? 'pm' : 'am'); // suporte adicional

  // 24h
  out = out.replace(/HH/g, two(H24));
  out = out.replace(/\bH\b/g, String(H24));

  // 12h
  out = out.replace(/hh/g, two(h12));
  out = out.replace(/\bh\b/g, String(h12));

  // Minutos
  out = out.replace(/mm/g, two(m));
  out = out.replace(/\bm\b/g, String(m));

  // Segundos
  out = out.replace(/ss/g, two(s));
  out = out.replace(/\bs\b/g, String(s));

  return out;
}

export default { formatDate, formatTime };
