function normalizeBank(text) {
  if (!text) return null;

  const t = text.toLowerCase();

  if (/bancolombia|bancolombiaombia|lane/i.test(t))
    return "Bancolombia";

  if (/nequi/i.test(t))
    return "NEQUI";

  if (/davivienda|daviplata/i.test(t))
    return "Davivienda";

  if (/bbva/i.test(t))
    return "BBVA";

  return text;
}

function normalizeMonto(monto) {
  if (!monto) return null;

  if (typeof monto === "string") {
    monto = monto
      .replace(/\$/g, "")
      .replace(/\./g, "")
      .replace(/,/g, "");

    monto = parseInt(monto);
  }

  if (isNaN(monto)) return null;

  // montos absurdos
  if (monto > 1000000000) return null;

  return monto;
}

function normalizeCuenta(cuenta) {
  if (!cuenta) return null;

  const digits = cuenta.replace(/\D/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0,3)}-${digits.slice(3,9)}-${digits.slice(9,11)}`;
  }

  if (digits.length === 10) return digits;

  return cuenta;
}

function normalizeReferencia(ref) {
  if (!ref) return null;

  ref = ref.trim();

  // si parece cuenta bancaria, eliminar
  if (/^\d{10,12}$/.test(ref)) return null;

  if (ref.length > 20) return null;

  return ref;
}

function normalizeDestino(dest) {
  if (!dest) return null;

  const digits = dest.replace(/\D/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0,3)}-${digits.slice(3,9)}-${digits.slice(9,11)}`;
  }

  if (digits.length >= 10) return digits;

  return dest;
}

function normalizeHora(hora) {
  if (!hora) return null;

  const match = hora.match(/(?:[01]?\d|2[0-3]):[0-5]\d/);

  if (match) return match[0];

  return null;
}

function postprocess(data) {
  if (!data) return data;

  const cleaned = { ...data };

  cleaned.monto = normalizeMonto(cleaned.monto);
  cleaned.banco = normalizeBank(cleaned.banco);
  cleaned.referencia = normalizeReferencia(cleaned.referencia);
  cleaned.destino = normalizeDestino(cleaned.destino);
  cleaned.cuenta = normalizeCuenta(cleaned.cuenta);
  cleaned.hora = normalizeHora(cleaned.hora);

  return cleaned;
}

module.exports = { postprocess };