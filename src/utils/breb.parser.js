const { normalizeAmount } = require('./amountNormalizer');

function parseBreb(text) {
  console.log('[BREB PARSER] Texto OCR recibido:\n', text);
  if (!text) text = '';

  const result = {
    type: 'BREB',
    data: {
      exitoso: false,
      comprobante: null,
      fecha: null,
      monto: null,
      costo: null,
      destino: null,
      enviado_a: null,
      codigo: null,
      origen: null
    }
  };
  
  // EXITOSO
  result.data.exitoso = /¡?pago exitoso!?/i.test(text);

  // COMPROBANTE
  let match = text.match(/Comprobante\s*No\.?\s*([A-Z0-9]+)/i);
  if (match) {
    result.data.comprobante = match[1];
  } else {
    console.warn('[BREB PARSER] No se pudo extraer el comprobante');
  }

  // FECHA
  match = text.match(
    /(\d{1,2}\s+[a-z]{3,}\.?\s+\d{4}(?:\s*-\s*\d{1,2}:\d{2}\s*[ap]\.?m\.?)?)/i
  );
  if (match) {
    result.data.fecha = match[1].trim();
  } else {
    console.warn('[BREB PARSER] No se pudo extraer la fecha');
  }

  // MONTO
  let montoRegex = /Valor\s+(?:del\s+pago|de\s+la\s+transferencia)[^\d]*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i;
  match = text.match(montoRegex);
  if (!match) {
    montoRegex = /Valor[^\d]*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i;
    match = text.match(montoRegex);
  }
  if (match) {
    result.data.monto = normalizeAmount(match[1]);
    if (result.data.monto !== null && result.data.monto < 100) {
      result.data.monto = null;
      console.warn('[BREB PARSER] Monto extraído pero es sospechosamente bajo');
    }
  } else {
    console.warn('[BREB PARSER] No se pudo extraer el monto');
  }

  // COSTO
  match = text.match(/Costo\s+(?:del\s+pago|de\s+la\s+transferencia)[\s:]*\$?\s*([0-9.,]+)/i);
  if (match) {
    result.data.costo = normalizeAmount(match[1]);
  } else {
    console.warn('[BREB PARSER] No se pudo extraer el costo');
  }

// ---- DESTINO (robusto para caracteres extraños) ----
const destinoBlockMatch = text.match(/Producto destino[\s\S]*?(?=Producto origen|$)/i);
if (destinoBlockMatch) {
  const destinoBlock = destinoBlockMatch[0];

  // Buscar directamente patrón con espacios o guiones
  let cuentaMatch = destinoBlock.match(/(\d{3})\s*-\s*(\d{5,6})\s*-\s*(\d{2})/);

  if (cuentaMatch) {
    result.data.destino = `${cuentaMatch[1]}-${cuentaMatch[2]}-${cuentaMatch[3]}`;
  } else {
    const digitos = destinoBlock.match(/\b\d{8,12}\b/);
    if (digitos) {
      result.data.destino = digitos[0];
    }
  }
}

  // ENVIADO A (permite asteriscos)
  match = text.match(/Enviado a\s+([A-Za-záéíóúÁÉÍÓÚ\s\*]+?)(?:\n|Código|$)/i);
  if (match) {
    result.data.enviado_a = match[1].trim();
  } else {
    console.warn('[BREB PARSER] No se pudo extraer "enviado a"');
  }

  // CÓDIGO DE NEGOCIO
  match = text.match(/Código de negocio\s+([0-9]+)/i);
  if (match) {
    result.data.codigo = match[1];
  } else {
    console.warn('[BREB PARSER] No se pudo extraer el código de negocio');
  }

  // ORIGEN
  match = text.match(/[¿D]e\s+dónde\s+salió[\s\S]{0,20}?\s+([A-Za-záéíóúÁÉÍÓÚ]+?)(?:\n|Producto|$)/i);
  if (match) {
    result.data.origen = match[1].trim();
  } else {
    console.warn('[BREB PARSER] No se pudo extraer el origen');
  }

  return result;
}

module.exports = { parseBreb };