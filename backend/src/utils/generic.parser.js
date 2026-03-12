const { normalizeAmount } = require('./amountNormalizer');
const { normalizeBanco, normalizeDate } = require('./normalizers');
const { extraerCuenta } = require('./cuentaExtractor');

function parseGeneric(text) {
  if (!text) text = '';

  console.warn('[GENERIC PARSER PRO HARDENED]');
  console.log('🔍 TEXTO ORIGINAL:\n', text);

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

  const cleanText = text
    .replace(/\r/g, '')
    .replace(/[|]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/(\d)\s+\.(\d)/g, '$1.$2')
    .trim();

  console.log('🧼 TEXTO LIMPIO:\n', cleanText);

  console.log('🔎 Buscando monto con moneda...');
  const montoMonedaRegex = /(\d+)\s*(USD|USDT|EUR|COP)\b/i;
  let matchMoneda = cleanText.match(montoMonedaRegex);
  console.log('Match moneda:', matchMoneda);
  if (matchMoneda) {
    const montoNumerico = normalizeAmount(matchMoneda[1]);
    console.log('Monto numérico:', montoNumerico);
    if (montoNumerico) {
      result.data.monto = montoNumerico;
    }
  }

  // Si no se encontró con moneda, usar el método anterior (con $)
  if (!result.data.monto) {
    console.log('🔎 Buscando monto con $...');
    const montoRegex = /\$?\s?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?/g;
    const candidatosRaw = cleanText.match(montoRegex) || [];
    console.log('Candidatos raw:', candidatosRaw);
    const candidatos = candidatosRaw
      .map(m => normalizeAmount(m))
      .filter(n => n && n >= 1000);
    console.log('Candidatos filtrados:', candidatos);

    let mejorMonto = null;
    let mejorScore = 0;

    candidatos.forEach(monto => {
      let score = 0;
      if (monto >= 10000) score += 2;
      if (monto >= 50000) score += 2;
      const contexto = new RegExp(`(valor|total|monto|pagaste|transferiste|enviaste|firma procesada).{0,40}${monto}`, 'i');
      if (contexto.test(cleanText)) score += 3;
      if (score > mejorScore) {
        mejorScore = score;
        mejorMonto = monto;
      }
    });

    if (candidatos.length === 1 && candidatos[0] >= 10000) {
      result.data.monto = candidatos[0];
    } else if (mejorScore >= 3) {
      result.data.monto = mejorMonto;
    }
    console.log('Monto seleccionado:', result.data.monto);
  }

  console.log('🔎 Buscando fecha...');
  let fechaMatch =
    cleanText.match(/\b(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?/) ||
    cleanText.match(/\b(\d{1,2}\s+de\s+[a-záéíóúÁÉÍÓÚ]+\s+de\s+\d{4})\b/i) ||
    cleanText.match(/\b(\d{1,2}\s+[a-záéíóúÁÉÍÓÚ]{3,}\.?\s+\d{4})\b/i) ||
    cleanText.match(/\b([a-záéíóúÁÉÍÓÚ]+\s+\d{1,2}\s+de\s+\d{4})\b/i) ||
    cleanText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);

  console.log('Fecha match:', fechaMatch);
  if (fechaMatch) {
    if (fechaMatch[1] && fechaMatch[1].includes('-')) {
      result.data.fecha = fechaMatch[1];
      if (fechaMatch[2]) {
        result.data.hora = fechaMatch[2];
      } else {
        let horaMatch = cleanText.match(/\b(\d{2}:\d{2}:\d{2})\b/);
        if (horaMatch) result.data.hora = horaMatch[1];
      }
    } else {
      result.data.fecha = fechaMatch[1].trim();
      result.data.fecha = normalizeDate(result.data.fecha);
    }
    console.log('Fecha asignada:', result.data.fecha, 'Hora:', result.data.hora);
  }

  if (!result.data.hora) {
    console.log('🔎 Buscando hora por separado...');
    let horaMatch = cleanText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?\s*m\.?|AM|PM)?)\b/i);
    console.log('Hora match:', horaMatch);
    if (horaMatch) {
      let hora = horaMatch[1].trim().replace(/\s+/g, ' ').toLowerCase();
      hora = hora.replace(/([ap])\s*m/, '$1.m');
      result.data.hora = hora;
    }
  }

  console.log('🔎 Buscando referencia...');
  let referenciaFinal = null;

  // Buscar ID de orden (tolerante a errores OCR: 1D por ID)
  let idMatch = cleanText.match(/(?:ID|1D)\s+de\s+orden[\s\S]*?(\d{8,})/i);
  console.log('ID match:', idMatch);
  if (idMatch) {
    referenciaFinal = idMatch[1];
  }

  // Buscar referencia explícita (palabras clave)
  if (!referenciaFinal) {
    let refMatch = cleanText.match(/(referencia|transacci[oó]n|id|número)\s*[-:]?\s*([A-Z0-9]{6,})/i);
    console.log('Ref match:', refMatch);
    if (refMatch) {
      referenciaFinal = refMatch[2];
    }
  }

  // 🆕 Buscar número de aprobación (para vouchers de DaviPlata, etc.)
  if (!referenciaFinal) {
    console.log('🔎 Buscando número de aprobación...');
    let aprobMatch = cleanText.match(/(?:Número de aprobación|Nº aprobación|aprobación)[\s:]*(\d+)/i);
    console.log('Aprob match:', aprobMatch);
    if (aprobMatch) {
      referenciaFinal = aprobMatch[1];
    }
  }

  // Fallback: números largos (más de 10 dígitos) como posible referencia
  if (!referenciaFinal) {
    const numerosLargos = cleanText.match(/\b\d{10,}\b/g);
    console.log('Números largos:', numerosLargos);
    if (numerosLargos && numerosLargos.length > 0) {
      referenciaFinal = numerosLargos.sort((a, b) => b.length - a.length)[0];
    }
  }

  // Fallback alfanumérico (códigos con letras y números)
  if (!referenciaFinal) {
    console.log('🔎 Buscando códigos alfanuméricos...');
    const alfaNumericos = cleanText.match(/\b[A-Z]*\d+[A-Z0-9]*\b/g);
    console.log('Alfanuméricos:', alfaNumericos);
    if (alfaNumericos) {
      referenciaFinal = alfaNumericos.find(code => {
        const tieneLetra = /[A-Z]/i.test(code);
        const tieneNumero = /\d/.test(code);
        const soloNumeros = /^\d+$/.test(code);
        return code.length >= 6 && tieneLetra && tieneNumero && !soloNumeros;
      });
    }
  }

  // Validación final contra palabras basura
  if (referenciaFinal) {
    const palabrasProhibidas = [
      "EXITOSA", "APROBADO", "TRANSFERENCIA", "PAGO",
      "BANCO", "NOTIFICACION", "ENVIO", "COMPRA", "PROCESADA"
    ];
    if (!palabrasProhibidas.includes(referenciaFinal.toUpperCase())) {
      result.data.referencia = referenciaFinal;
    }
  }
  console.log('Referencia asignada:', result.data.referencia);

  // ==========================================================
  // 🔥 DESTINO
  // ==========================================================
  let destMatch =
    cleanText.match(/(?:Para|Destino|Producto destino)[\s\S]{0,40}?([0-9\-]{8,})/i) ||
    cleanText.match(/(?:Para|Destino|Producto destino)[\s\S]{0,40}?([0-9\-]{8,})/i);
  if (destMatch) {
    const numero = destMatch[1].replace(/[^0-9-]/g, '').trim();
    if (numero.length >= 8 && numero.length <= 15) {
      result.data.destino = numero;
    }
  }

  if (!result.data.destino) {
    const contextoBancario = /ahorros|corriente|producto destino|número de cuenta|destino|titular/i.test(text);
    if (contextoBancario) {
      const cuenta = extraerCuenta(text);
      if (cuenta) {
        result.data.destino = cuenta;
        console.log('🔁 Destino asignado por fallback global (con contexto):', cuenta);
      }
    }
  }

  if (!result.data.destino) {
    // Buscar después de "Cuenta Corriente" o "Cuenta de Ahorros"
    let cuentaDavi = cleanText.match(/(?:Cuenta Corriente|Cuenta de Ahorros)[\s\S]*?(\d{3,4}\s?\d{4}\s?\d{4})/i);
    console.log('🔎 Cuenta DaviPlata match:', cuentaDavi);
    if (cuentaDavi) {
      let numero = cuentaDavi[1].replace(/\s/g, '');
      if (numero.length === 11) {
        result.data.destino = numero;
        console.log('🏦 Destino asignado por cuenta DaviPlata:', numero);
      }
    }
  }

  let compMatch = cleanText.match(/Comprobante\s*No\.?\s*([0-9]+)/i);
  if (compMatch) {
    result.data.comprobante = compMatch[1];
  }

  console.log('🔎 Buscando origen...');
  let origenMatch =
    cleanText.match(/(?:Alias|Desde|Origen|De)[\s:]+([A-Za-záéíóúÁÉÍÓÚ@.\s]+?)(?:\n|$)/i);
  console.log('Origen match:', origenMatch);
  if (origenMatch) {
    result.data.origen = origenMatch[1].trim().split(/\s+/).slice(0, 3).join(' ');
  } else {
    let fallback = cleanText.match(/(?:De|Desde|Origen)[\s\S]{0,40}?([A-Za-záéíóúÁÉÍÓÚ\s]{4,}?)(?:\n|$)/i);
    if (fallback) {
      result.data.origen = fallback[1].trim().split(/\s+/).slice(0, 3).join(' ');
    }
  }

  let bancoMatch = cleanText.match(/Banco\s+([A-Za-záéíóúÁÉÍÓÚ]+)/i);
  if (bancoMatch) {
    result.data.banco = bancoMatch[1];
  }
  if (result.data.banco) {
    result.data.banco = normalizeBanco(result.data.banco);
  }

  let costoMatch = cleanText.match(/Costo\s+[^\d]*\$?\s*([0-9.,]+)/i);
  if (costoMatch) {
    result.data.costo = normalizeAmount(costoMatch[1]);
  }

  let cuentaMatch = cleanText.match(/[Cc]uenta\s*[-:]?\s*([0-9\-]+)/);
  if (cuentaMatch) {
    result.data.cuenta = cuentaMatch[1];
  }

  console.log('[GENERIC HARDENED RESULT]', JSON.stringify(result, null, 2));
  return result;
}

module.exports = { parseGeneric };