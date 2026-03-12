function detectReceiptType(text) {

  if (!text) return 'GENERIC';

  text = text
    .replace(/[€]/g, 'e')
    .replace(/[|]/g, 'i')
    .replace(/[0]/g, 'o')
    .toLowerCase();

  const score = {
    NEQUI: 0,
    BREB: 0,
    TRANSFER: 0
  };

  if (/nequi/.test(text)) score.NEQUI += 3;
  if (/pago exitoso.*nequi/.test(text)) score.NEQUI += 2;
  if (/escanea este/.test(text)) score.NEQUI += 2;

  if (/bre-?b/.test(text)) score.BREB += 3;
  if (/codigo de negocio/.test(text)) score.BREB += 2;

  if (/transferencia/.test(text)) score.TRANSFER += 3;
  if (/producto destino/.test(text)) score.TRANSFER += 2;
  if (/producto origen/.test(text)) score.TRANSFER += 2;

  if (/bancolombia/.test(text)) score.TRANSFER += 2;

  const best =
    Object.entries(score)
      .sort((a,b)=>b[1]-a[1])[0];

  if (best[1] >= 3) return best[0];

  return 'GENERIC';
}

module.exports = { detectReceiptType };