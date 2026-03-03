const { normalizeAmount } = require('./amountNormalizer');

function cleanComprobante(raw) {
  if (!raw) return null;

  let value = raw.replace(/\D/g, '');

  // Si tiene 12 dígitos (año pegado), tomar primeros 10
  if (value.length === 12) {
    return value.slice(0, 10);
  }

  // Si es muy largo, cortar a 12
  if (value.length > 12) {
    return value.slice(0, 12);
  }

  return value;
}

function parseTransfer(text) {
  console.log('[TRANSFER PARSER] Texto OCR recibido:\n', text);
  if (!text) text = '';

  const result = {
    type: 'TRANSFER',
    data: {
      exitosa: false,
      comprobante: null,
      fecha: null,
      hora: null,
      monto: null,
      costo: null,
      destino: null,
      origen: null
    }
  };

  // -----------------------------------
  // EXITOSA
  // -----------------------------------
  result.data.exitosa = /transferencia exitosa/i.test(text);

  // -----------------------------------
  // COMPROBANTE (tolerante OCR)
  // -----------------------------------
  let compMatch = text.match(/(Comprobante|Cemprohante)[^\d]{0,20}(\d{8,})/i);
  if (compMatch) {
    result.data.comprobante = cleanComprobante(compMatch[2]);
  }

  // ---- FECHA Y HORA (ultra robusto) ----
  let fechaHoraRegexList = [
    // 09 Feb 2026 02:42 p.m.
    /(\d{1,2}\s+[a-záéíóú\.]+\s+\d{4})[^0-9]*(\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?|AM|PM))/i,
    // 20/02/2026 04:50 PM
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM|[ap]\.?\s*m\.?))/i,
    // 2026-02-20 16:50
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s+(\d{1,2}:\d{2})/i,
    // Formato ruidoso como "20) Fe 2026-0427 p.m." (imagen15)
    /(\d{1,2})\)?\s*([A-Za-z]{2,})\s*(\d{4})[-\s]*(\d{2}:\d{2})\s*(.*)/i
  ];

  for (let regex of fechaHoraRegexList) {
    let match = text.match(regex);
    if (match) {
      if (regex === fechaHoraRegexList[3]) {
        // Caso especial para imagen15: reconstruir fecha y hora
        result.data.fecha = `${match[1]} de ${match[2]} de ${match[3]}`;
        result.data.hora = match[4].toLowerCase().replace(/\s+/g, ' ').replace(/([ap])\s*m/, '$1.m');
      } else {
        result.data.fecha = match[1].trim();
        let hora = match[2].trim().toLowerCase();
        hora = hora.replace(/\s+/g, ' ');
        hora = hora.replace(/([ap])\s*m/, '$1.m');
        result.data.hora = hora;
      }
      break;
    }
  }

  // -----------------------------------
  // AISLAR BLOQUE DATOS
  // -----------------------------------
  const dataBlockMatch = text.match(
    /Datos de la transferencia\s*([\s\S]*?)(?=Producto destino|$)/i
  );

  const dataBlock = dataBlockMatch ? dataBlockMatch[1] : text;

  // -----------------------------------
  // MONTO PRINCIPAL
  // -----------------------------------
  const montoRegex =
    /Valor\s+de\s+la\s+transferencia[^\d]*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i;

  let match = dataBlock.match(montoRegex);

  if (!match) {
    const montoFallback = dataBlock.match(
      /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?)/
    );
    if (montoFallback) match = montoFallback;
  }

  if (match) {
    result.data.monto = normalizeAmount(match[1]);
  }

  // -----------------------------------
  // COSTO
  // -----------------------------------
  const costoRegex =
    /Costo\s+de\s+la\s+transferencia[^\d]*\$?\s*([0-9.,]+)/i;

  match = dataBlock.match(costoRegex);

  if (match) {
    result.data.costo = normalizeAmount(match[1]);
  }

  // -----------------------------------
  // DESTINO
  // -----------------------------------
  const destinoBlockMatch = text.match(
    /Producto destino[\s\S]*?(?=Producto origen|$)/i
  );

  if (destinoBlockMatch) {
    const destinoBlock = destinoBlockMatch[0];

    const cleanBlock = destinoBlock.replace(/[^\d-]/g, '');

    let cuentaMatch = cleanBlock.match(/(\d{3})-(\d{6})-(\d{2})/);

    if (cuentaMatch) {
      result.data.destino = `${cuentaMatch[1]}-${cuentaMatch[2]}-${cuentaMatch[3]}`;
    } else {
      const digitos = cleanBlock.replace(/\D/g, '');

      if (digitos.length >= 11) {
        result.data.destino = `${digitos.slice(0,3)}-${digitos.slice(3,9)}-${digitos.slice(9,11)}`;
      } else if (digitos.length >= 8) {
        result.data.destino = digitos;
      }
    }
  }

  // -----------------------------------
  // ORIGEN
  // -----------------------------------
  const origenBlockMatch = text.match(/Producto origen[\s\S]*?$/i);

  if (origenBlockMatch) {
    const origenBlock = origenBlockMatch[0];

    const tipoMatch = origenBlock.match(/(Ahorros|Corriente)/i);

    if (tipoMatch) {
      result.data.origen = `Cuenta de ${tipoMatch[1]}`;
    }
  }

  // -----------------------------------
  // MONTO FALLBACK GLOBAL (clave para imagen15)
  // -----------------------------------
  if (!result.data.monto) {
    const globalMoney = text.match(
      /\$\s*([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?)/
    );

    if (globalMoney) {
      const value = normalizeAmount(globalMoney[1]);

      if (value && value > 1000) {
        result.data.monto = value;
      }
    }
  }

  // -----------------------------------
  // VALIDACIÓN FINAL
  // -----------------------------------
  if (!result.data.monto || !result.data.comprobante) {
    result.data.exitosa = false;
  }

  return result;
}

module.exports = { parseTransfer };