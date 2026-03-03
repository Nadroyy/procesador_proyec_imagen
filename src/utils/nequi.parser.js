const { normalizeAmount } = require('./amountNormalizer');

function parseNequi(text) {
  console.log('[NEQUI PARSER] Texto OCR recibido:\n', text);
  if (!text) text = '';

  const result = {
    type: 'NEQUI',
    data: {
      destino: null,
      monto: null,
      fecha: null,
      hora: null,
      banco: null,
      cuenta: null,
      referencia: null,
      origen: null
    }
  };

  // ---- MONTO ----
  let match = text.match(/\$\s*([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?)/);
  if (!match) {
    match = text.match(/cuanto[^\d]*([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?)/i);
  }
  if (!match) {
    const pagoEn = text.match(/Pago en[^\n]*\n?\s*\$?\s*([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?)/i);
    if (pagoEn) match = pagoEn;
  }
  if (!match) {
    const numbers = text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?/g);
    if (numbers) {
      match = [null, numbers.sort((a,b)=>b.length-a.length)[0]];
    }
  }
  if (match) {
    result.data.monto = normalizeAmount(match[1]);
  } else {
    console.warn('[NEQUI PARSER] No se pudo extraer el monto');
  }

  // ---- FECHA y HORA (corregido) ----
  const fechaHoraRegex = /(\d{1,2}\s+de\s+[a-záéíóúÁÉÍÓÚ]+\s+de\s+\d{4})[^0-9]*(\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?|AM|PM))/i;
  match = text.match(fechaHoraRegex);
  if (match) {
    result.data.fecha = match[1].trim();
    if (match[2]) {
      let hora = match[2].trim().replace(/\s+/g, ' ').toLowerCase();
      hora = hora.replace(/([ap])\s*\.?\s*m\.?/i, '$1.m.');
      result.data.hora = hora;
    }
  } else {
    // Fallback: solo fecha
    match = text.match(/(\d{1,2}\s+de\s+[a-záéíóúÁÉÍÓÚ]+\s+de\s+\d{4})/i);
    if (match) result.data.fecha = match[1].trim();
    else console.warn('[NEQUI PARSER] No se pudo extraer la fecha');
    
    // Fallback: solo hora (si la fecha falló pero hay hora)
    let horaMatch = text.match(/(\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?|AM|PM))/i);
    if (horaMatch) {
      let hora = horaMatch[1].trim().replace(/\s+/g, ' ').toLowerCase();
      hora = hora.replace(/([ap])\s*\.?\s*m\.?/i, '$1.m.');
      result.data.hora = hora;
    }
  }

  // ---- BANCO ----
  match = text.match(/Banco\s+([A-Za-záéíóúÁÉÍÓÚ]+)/i);
  if (match) {
    let banco = match[1].trim();
    if (banco.length === 1 && /bancolombia/i.test(text)) {
      banco = 'Bancolombia';
    }
    result.data.banco = banco;
  } else if (/bancolombia/i.test(text)) {
    result.data.banco = 'Bancolombia';
  } else {
    console.warn('[NEQUI PARSER] No se pudo extraer el banco');
  }

  // ---- CUENTA / DESTINO ----
  match = text.match(/[Nn]umero\s+de\s+[Cc]uenta\s*[-:]?\s*([0-9\-]+)/);
  if (!match) {
    match = text.match(/[Cc]uenta\s*[-:]?\s*([0-9\-]+)/);
  }
  if (!match) {
    const paraMatch = text.match(/Para\s+([A-Za-záéíóúÁÉÍÓÚ\s]+?)(?:\n|$)/i);
    if (paraMatch) {
      const block = paraMatch[1];
      const numMatch = block.match(/([0-9]{3,}[\s-]*[0-9]{3,}[\s-]*[0-9]{2,})/);
      if (numMatch) match = [null, numMatch[1]];
    }
  }
  if (!match) {
    const digitos = text.match(/\b(\d{8,12})\b/);
    if (digitos) match = [null, digitos[1]];
  }
  if (match) {
    result.data.cuenta = match[1];
    result.data.destino = match[1].replace(/[^0-9-]/g, '').trim();
  } else {
    console.warn('[NEQUI PARSER] No se pudo extraer el número de cuenta');
  }

  // ---- REFERENCIA ----
  match = text.match(/[Rr]eferencia\s*[-:]?\s*([A-Z0-9]+)/);
  if (!match) {
    match = text.match(/\b([A-Z][A-Z0-9]{6,})\b/);
  }
  if (match) {
    result.data.referencia = match[1];
  } else {
    console.warn('[NEQUI PARSER] No se pudo extraer la referencia');
  }

  // ---- ORIGEN ----
  let origenMatch = text.match(/[¿D]e\s+dónde\s+salió\s+la\s+plata\?\s*([A-Za-záéíóúÁÉÍÓÚ\s]+?)(?:\n|$)/i);
  if (!origenMatch) {
    const refIndex = text.search(/Referencia\s+[A-Z0-9]+\s*/i);
    if (refIndex !== -1) {
      const afterRef = text.substring(refIndex);
      const dispMatch = afterRef.match(/(Disponible)/i);
      if (dispMatch) {
        origenMatch = [null, dispMatch[1]];
      } else {
        const lines = afterRef.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 1) {
          origenMatch = [null, lines[1]];
        }
      }
    }
  }
  if (origenMatch) {
    result.data.origen = (origenMatch[1] || origenMatch[0]).trim();
  } else {
    console.warn('[NEQUI PARSER] No se pudo extraer el origen');
  }

  return result;
}

module.exports = { parseNequi };