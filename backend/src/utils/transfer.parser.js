const { normalizeAmount } = require('./amountNormalizer');
const { normalizeDate, mesesMap } = require('./normalizers');
const { extraerCuenta } = require('./cuentaExtractor');

function cleanComprobante(raw) {
  if (!raw) return null;
  let value = raw.replace(/\D/g, '');
  if (value.length === 12) return value.slice(0, 10);
  if (value.length > 12) return value.slice(0, 12);
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

  result.data.exitosa = /transferencia exitosa/i.test(text);

  let compMatch = text.match(/(Comprobante|Cemprohante)[^\d]{0,20}(\d{8,})/i);
  if (compMatch) result.data.comprobante = cleanComprobante(compMatch[2]);

  // FECHA Y HORA
let fechaHoraRegexList = [
  // 09 Feb 2026 02:42 p.m.
  /(\d{1,2}\s+[a-záéíóú\.]+\s+\d{4})[^0-9]*(\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?|AM|PM))/i,
  // 20/02/2026 04:50 PM
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM|[ap]\.?\s*m\.?))/i,
  // 2026-02-20 16:50
  /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s+(\d{1,2}:\d{2})/i,
  // Formato ruidoso como "20) Fe 2026-0427 p.m." (imagen15)
  /(\d{1,2})\)?\s*([A-Za-z]{2,})\s*(\d{4})[-\s]*(\d{2}:\d{2})\s*(.*)/i,
  // 🆕 Fecha sola: 20 Feb 2026 o 20 Feb. 2026
  /(\d{1,2})\s+([a-záéíóú]{3,}\.?)\.?\s+(\d{4})/i
];

for (let regex of fechaHoraRegexList) {
  let match = text.match(regex);
  if (match) {
    if (regex === fechaHoraRegexList[3]) {
      // Caso especial para imagen15
      result.data.fecha = `${match[1]} de ${match[2]} de ${match[3]}`;
      result.data.hora = match[4].toLowerCase().replace(/\s+/g, ' ').replace(/([ap])\s*m/, '$1.m');
    } else if (regex === fechaHoraRegexList[4]) {
      // Caso de fecha sola
      let dia = match[1].padStart(2, '0');
      let mesRaw = match[2].toLowerCase().replace(/\.$/, '');
      let año = match[3];
      // Convertir mes a número usando mesesMap (de normalizers)
      let mes = mesesMap[mesRaw] || '01';
      result.data.fecha = `${año}-${mes}-${dia}`;
      // No hay hora
    } else {
      result.data.fecha = match[1].trim();
      let hora = match[2].trim().toLowerCase();
      hora = hora.replace(/\s+/g, ' ').replace(/([ap])\s*m/, '$1.m');
      result.data.hora = hora;
    }
    break;
  }
}
  // DESTINO
  const destinoBlockMatch = text.match(/Producto destino[\s\S]*?(?=Producto origen|$)/i);
  if (destinoBlockMatch) {
    const destinoBlock = destinoBlockMatch[0];
    console.log('🔍 Bloque destino original:', destinoBlock);

    // Buscar patrón de cuenta con separadores
    const cuentaRegex = /(\d{3})\s*[-]?\s*(\d{5,6})\s*[-]?\s*(\d{2})/;
    let cuentaMatch = destinoBlock.match(cuentaRegex);
    console.log('🔎 Patrón de cuenta encontrado:', cuentaMatch);

    if (cuentaMatch) {
      result.data.destino = `${cuentaMatch[1]}-${cuentaMatch[2]}-${cuentaMatch[3]}`;
      console.log('✅ Destino asignado:', result.data.destino);
    } else {
      // Fallback: tomar todos los dígitos y formatear
      const digitos = destinoBlock.replace(/\D/g, '');
      console.log('🔢 Dígitos encontrados (fallback):', digitos);
      if (digitos.length >= 11) {
        result.data.destino = `${digitos.slice(0,3)}-${digitos.slice(3,9)}-${digitos.slice(9,11)}`;
      } else if (digitos.length >= 8) {
        result.data.destino = digitos;
      }
    }
  }

  // ==========================================================
  // 🔥 FALLBACK GLOBAL DE CUENTA
  // ==========================================================
  if (!result.data.destino) {
    const cuenta = extraerCuenta(text);
    if (cuenta) {
      result.data.destino = cuenta;
      console.log('🔁 Destino asignado por fallback global:', cuenta);
    }
  }

  const origenBlockMatch = text.match(/Producto origen[\s\S]*?$/i);
  if (origenBlockMatch) {
    const origenBlock = origenBlockMatch[0];
    const tipoMatch = origenBlock.match(/(Ahorros|Corriente)/i);
    if (tipoMatch) result.data.origen = `Cuenta de ${tipoMatch[1]}`;
  }

  if (!result.data.monto) {
    const globalMoney = text.match(/\$\s*([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?)/);
    if (globalMoney) {
      const value = normalizeAmount(globalMoney[1]);
      if (value && value > 1000) result.data.monto = value;
    }
  }

  if (!result.data.monto || !result.data.comprobante) result.data.exitosa = false;
  return result;
}

module.exports = { parseTransfer };