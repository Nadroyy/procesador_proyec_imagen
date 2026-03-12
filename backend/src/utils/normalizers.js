// src/utils/normalizers.js

const mesesMap = {
  // Meses correctos y variantes OCR
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  // Errores comunes OCR
  febreto: '02', febreo: '02', febrro: '02',
  enro: '01', ebero: '02', marso: '03', abri: '04',
  mayp: '05', junoi: '06', jullio: '07', agos: '08',
  septiembe: '09', octubr: '10', noviembr: '11', diciembr: '12',
  feb: '02', abr: '04', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12'
};

const mesesCanonicos = {
  '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
  '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
  '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
};

/**
 * Normaliza el nombre del banco a un valor estándar.
 * @param {string} bancoRaw - Nombre extraído por OCR
 * @returns {string|null} - Nombre normalizado o null si no se reconoce
 */
function normalizeBanco(bancoRaw) {
  if (!bancoRaw) return null;
  const lower = bancoRaw.toLowerCase();
  if (/bancolombia|bancol|bancolar/.test(lower)) return 'Bancolombia';
  if (/davivienda|davivi/.test(lower)) return 'Davivienda';
  if (/bbva/.test(lower)) return 'BBVA';
  if (/nequi/.test(lower)) return 'Nequi';
  if (/bre-?b/i.test(bancoRaw)) return 'Bre-B';
  // Agrega más según tus necesidades
  return bancoRaw; // si no hay match, devolver el original
}

/**
 * Normaliza una fecha en formato "día de mes de año" a una representación estándar.
 * Si no puede normalizar, devuelve la fecha original.
 * @param {string} dateStr
 * @returns {string|null}
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase();
  const match = lower.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/);
  if (!match) return dateStr; // No se pudo normalizar, devolver original
  const [_, diaRaw, mesRaw, año] = match;
  const dia = diaRaw.padStart(2, '0');
  const mesNum = mesesMap[mesRaw] || '01';
  const mesCanonico = mesesCanonicos[mesNum] || mesRaw;
  return `${dia} de ${mesCanonico} de ${año}`;
}

module.exports = {
  normalizeBanco,
  normalizeDate,
  mesesMap
};