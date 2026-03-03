function detectReceiptType(text) {
  if (!text) return 'GENERIC';

  const score = {
    NEQUI: 0,
    BREB: 0,
    TRANSFER: 0
  };

  // NEQUI señales
  if (/nequi/i.test(text)) score.NEQUI += 3;
  if (/pago exitoso.*nequi/i.test(text)) score.NEQUI += 2;
  if (/escanea este (?:qr|código|or) con nequi/i.test(text)) score.NEQUI += 2;
  if (/¿cuánto\?|cuanto/i.test(text)) score.NEQUI += 1;
  if (/pago realizado/i.test(text)) score.NEQUI += 1;
  if (/pago en alianxa/i.test(text)) score.NEQUI += 2;
  if (/verificar tu (?:envío|pago)/i.test(text)) score.NEQUI += 2;
  if (/de dónde salió la plata/i.test(text)) score.NEQUI += 1;

  // BREB señales
  if (/bre-?b/i.test(text)) score.BREB += 3;
  if (/punto de venta/i.test(text)) score.BREB += 2;
  if (/código de negocio/i.test(text)) score.BREB += 2;
  if (/¡pago exitoso!/i.test(text)) score.BREB += 1;

  // TRANSFER señales
  if (/transferencia/i.test(text)) score.TRANSFER += 3;
  if (/producto destino/i.test(text)) score.TRANSFER += 2;
  if (/producto origen/i.test(text)) score.TRANSFER += 2;
  if (/comprobante no\./i.test(text)) score.TRANSFER += 1;
  if (/valor de la transferencia/i.test(text)) score.TRANSFER += 1;

  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  if (best[0] === 'NEQUI' && best[1] >= 2) return 'NEQUI';
  return best[1] >= 3 ? best[0] : 'GENERIC';
}

module.exports = { detectReceiptType };