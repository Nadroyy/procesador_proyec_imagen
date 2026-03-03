const { normalizeAmount } = require('./amountNormalizer');

/**
 * GENERIC PARSER PRO HARDENED FINAL (MEJORADO)
 */
function parseGeneric(text) {
  if (!text) text = '';

  console.warn('[GENERIC PARSER PRO HARDENED]');

  const result = {
    type: 'GENERIC',
    data: {
      monto: null,
      fecha: null,
      hora: null,
      referencia: null,
      destino: null,
      origen: null,
      comprobante: null,
      costo: null,
      banco: null,
      cuenta: null
    }
  };

  // ==========================================================
  // 🔥 1️⃣ LIMPIEZA OCR
  // ==========================================================
  const cleanText = text
    .replace(/\r/g, '')
    .replace(/[|]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/(\d)\s+\.(\d)/g, '$1.$2')
    .trim();

  // ==========================================================
  // 🔥 MONTO INTELIGENTE (SCORING + fallback seguro)
  // ==========================================================
  const montoRegex = /\$?\s?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?/g;
  const candidatosRaw = cleanText.match(montoRegex) || [];

  const candidatos = candidatosRaw
    .map(m => normalizeAmount(m))
    .filter(n => n && n >= 1000);

  let mejorMonto = null;
  let mejorScore = 0;

  candidatos.forEach(monto => {
    let score = 0;

    if (monto >= 10000) score += 2;
    if (monto >= 50000) score += 2;

    // Contexto ampliado
    const contexto = new RegExp(
      `(valor|total|monto|pagaste|transferiste|enviaste|firma procesada).{0,40}${monto}`,
      'i'
    );

    if (contexto.test(cleanText)) score += 3;

    if (score > mejorScore) {
      mejorScore = score;
      mejorMonto = monto;
    }
  });

  // Si solo hay un candidato grande, tomarlo aunque no tenga contexto
  if (candidatos.length === 1 && candidatos[0] >= 10000) {
    result.data.monto = candidatos[0];
  } else if (mejorScore >= 3) {
    result.data.monto = mejorMonto;
  }

  // ==========================================================
  // 🔥 FECHA ROBUSTA AMPLIADA
  // ==========================================================
  let fechaMatch =
    // Formato: día de mes de año (ej. 27 de diciembre de 2025)
    cleanText.match(/\b(\d{1,2}\s+de\s+[a-záéíóúÁÉÍÓÚ]+\s+de\s+\d{4})\b/i) ||
    // Formato: día mes año (ej. 09 Feb 2026)
    cleanText.match(/\b(\d{1,2}\s+[a-záéíóúÁÉÍÓÚ]{3,}\.?\s+\d{4})\b/i) ||
    // Formato: mes día de año (ej. Febrero 20 de 2026) → NUEVO
    cleanText.match(/\b([a-záéíóúÁÉÍÓÚ]+\s+\d{1,2}\s+de\s+\d{4})\b/i) ||
    // Formato: día/mes/año
    cleanText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/) ||
    // Formato: año-mes-día
    cleanText.match(/\b(\d{4}-\d{2}-\d{2})\b/);

  if (fechaMatch) {
    result.data.fecha = fechaMatch[1].trim();
  }

  // ==========================================================
  // 🔥 HORA
  // ==========================================================
  let horaMatch = cleanText.match(/\b(\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?|AM|PM))\b/i);
  if (horaMatch) {
    let hora = horaMatch[1]
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/([ap])\s*m/, '$1.m');
    result.data.hora = hora;
  }

// ==========================================================
// 🔥 REFERENCIA ULTRA BLINDADA
// ==========================================================
let referenciaFinal = null;

// 1️⃣ Buscar referencia explícita
let refMatch = cleanText.match(
  /(referencia|transacci[oó]n|id|número)\s*[-:]?\s*([A-Z0-9]{6,})/i
);

if (refMatch) {
  referenciaFinal = refMatch[2];
}

// 2️⃣ Fallback SOLO alfanumérico (no solo números)
if (!referenciaFinal) {
  const alfaNumericos = cleanText.match(/\b[A-Z]*\d+[A-Z0-9]*\b/g);

  if (alfaNumericos) {
    referenciaFinal = alfaNumericos.find(code => {
      const tieneLetra = /[A-Z]/i.test(code);
      const tieneNumero = /\d/.test(code);
      const soloNumeros = /^\d+$/.test(code);

      return (
        code.length >= 6 &&
        tieneLetra &&
        tieneNumero &&
        !soloNumeros
      );
    });
  }
}

// 3️⃣ Validación final contra palabras basura
if (referenciaFinal) {
  const palabrasProhibidas = [
    "EXITOSA", "APROBADO", "TRANSFERENCIA", "PAGO",
    "BANCO", "NOTIFICACION", "ENVIO",
    "COMPRA", "PROCESADA"
  ];

  if (!palabrasProhibidas.includes(referenciaFinal.toUpperCase())) {
    result.data.referencia = referenciaFinal;
  }
}

  // ==========================================================
  // 🔥 DESTINO ENDURECIDO (sin excluir 018000)
  // ==========================================================
  let destMatch =
    cleanText.match(/(?:Para|Destino|Producto destino)[\s\S]{0,40}?([0-9\-]{8,})/i) ||
    cleanText.match(/(?:Para|Destino|Producto destino)[\s\S]{0,40}?([0-9\-]{8,})/i)

  if (destMatch) {
    const numero = destMatch[1].replace(/[^0-9-]/g, '').trim();
    // Solo validar longitud, sin excluir por prefijo
    if (numero.length >= 8 && numero.length <= 15) {
      result.data.destino = numero;
    }
  }

  // ==========================================================
  // 🔥 COMPROBANTE
  // ==========================================================
  let compMatch = cleanText.match(/Comprobante\s*No\.?\s*([0-9]+)/i);
  if (compMatch) {
    result.data.comprobante = compMatch[1];
  }

  // ==========================================================
  // 🔥 ORIGEN (básico)
  // ==========================================================
  let origenMatch = cleanText.match(/(?:De|Desde|Origen)[\s\S]{0,40}?([A-Za-záéíóúÁÉÍÓÚ\s]{4,}?)(?:\n|$)/i);
  if (origenMatch) {
    result.data.origen = origenMatch[1].trim();
  }

  // ==========================================================
  // 🔥 BANCO
  // ==========================================================
  let bancoMatch = cleanText.match(/Banco\s+([A-Za-záéíóúÁÉÍÓÚ]+)/i);
  if (bancoMatch) {
    result.data.banco = bancoMatch[1];
  }

  // ==========================================================
  // 🔥 COSTO
  // ==========================================================
  let costoMatch = cleanText.match(/Costo\s+[^\d]*\$?\s*([0-9.,]+)/i);
  if (costoMatch) {
    result.data.costo = normalizeAmount(costoMatch[1]);
  }

  // ==========================================================
  // 🔥 CUENTA
  // ==========================================================
  let cuentaMatch = cleanText.match(/[Cc]uenta\s*[-:]?\s*([0-9\-]+)/);
  if (cuentaMatch) {
    result.data.cuenta = cuentaMatch[1];
  }

  console.log('[GENERIC HARDENED RESULT]', JSON.stringify(result, null, 2));
  return result;
}

module.exports = { parseGeneric };