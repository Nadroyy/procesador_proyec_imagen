/**
 * Orquestador principal de parsers
 */

const { detectReceiptType } = require('./detector');
const { parseNequi } = require('./nequi.parser');
const { parseBreb } = require('./breb.parser');
const { parseTransfer } = require('./transfer.parser');
const { parseGeneric } = require('./generic.parser');

/**
 * Limpieza fuerte de texto OCR
 */
function cleanText(rawText) {
  if (!rawText) return '';

  let text = rawText;

  // 1️⃣ eliminar caracteres de control
  text = text.replace(/[\x00-\x1F\x7F]/g, ' ');

  // 2️⃣ corregir errores comunes OCR
  text = text
    .replace(/Ue\s*S/gi, '$')
    .replace(/S\s+(\d)/g, '$$$1')
    .replace(/O(?=\d)/g, '0')
    .replace(/l(?=\d)/g, '1');

  // 3️⃣ unir números separados por espacios
  text = text.replace(/(\d)\s+(?=\d)/g, '$1');

  // 4️⃣ colapsar espacios múltiples
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Función principal que detecta tipo y ejecuta parser correcto
 */
function parseAll(rawText) {
  try {
    const cleanedText = cleanText(rawText);

    const receiptType = detectReceiptType(cleanedText);

    console.log(`🔥 PARSER: Tipo detectado -> ${receiptType}`);

    let result;

    switch (receiptType) {
      case 'NEQUI':
        result = parseNequi(cleanedText);
        break;

      case 'BREB':
        result = parseBreb(cleanedText);
        break;

      case 'TRANSFER':
        result = parseTransfer(cleanedText);
        break;

      default:
        result = parseGeneric(cleanedText);
        break;
    }

    // Función para eliminar campos nulos
    function removeNullFields(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, value]) => value !== null && value !== undefined)
          .map(([key, value]) => [
            key,
            typeof value === 'object' && !Array.isArray(value)
              ? removeNullFields(value)
              : value
          ])
      );
    }

    console.log('✅ Resultado final:', JSON.stringify(result, null, 2));

    // Eliminar campos null antes de devolver
    result.data = removeNullFields(result.data);

    return result;

  } catch (error) {
    console.error('❌ Error en parseAll:', error.message || error);
    return { type: 'UNKNOWN', data: {} };
  }
}

module.exports = {
  parseAll,
  cleanText
};