function normalizeAmount(value) {
  if (!value) return null;

  let v = value.replace(/[^\d.,]/g, '');

  if (v.includes('.') && v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (v.includes('.')) {
    const parts = v.split('.');
    if (parts[1] && parts[1].length === 3) {
      v = v.replace(/\./g, '');
    }
  }

  let n = parseFloat(v);
  if (isNaN(n)) return null;

  return Math.round(n);
}

module.exports = { normalizeAmount };