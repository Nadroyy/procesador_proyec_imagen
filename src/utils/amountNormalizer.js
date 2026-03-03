function normalizeAmount(value) {
  if (!value) return null;

  let v = value.replace(/[^\d.,]/g, '');

  // Caso con punto y coma (ej: 200,000.00)
  if (v.includes('.') && v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.');
  }
  // Caso formato europeo (ej: 200.000,00)
  else if (v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.');
  }
  // Solo punto decimal
  else if (v.includes('.')) {
    const parts = v.split('.');
    if (parts[1] && parts[1].length === 3) {
      v = v.replace(/\./g, '');
    }
  }

  let n = parseFloat(v);
  if (isNaN(n)) return null;

  // Heurística anti-OCR: si es muy grande y termina en 00, dividir por 100
  if (n >= 10000000 && v.endsWith('00')) {
    const divided = n / 100;
    if (divided < 5000000) {
      n = divided;
    }
  }

  // Nueva regla: montos menores a 1000 solo se aceptan si el texto original tenía '$'
  if (n < 1000 && !value.includes('$')) {
    return null;
  }

  return Math.round(n);
}

module.exports = { normalizeAmount };