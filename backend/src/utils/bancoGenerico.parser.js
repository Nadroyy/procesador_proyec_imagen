function parseBancoGenerico(text) {

  const result = {
    data: {
      monto: null,
      fecha: null,
      hora: null,
      referencia: null,
      destino: null,
      banco: null
    }
  };

  const montoMatch = text.match(/\$\s?([\d\.,]+)/);

  if (montoMatch) {

    const monto = montoMatch[1]
      .replace(/\./g, '')
      .replace(',', '');

    result.data.monto = parseInt(monto);

  }

  const fechaMatch = text.match(
    /(\d{1,2}\sde\s[a-záéíóú]+\sde\s\d{4})|(\d{4}-\d{2}-\d{2})/i
  );

  if (fechaMatch) {
    result.data.fecha = fechaMatch[0];
  }

  const horaMatch = text.match(
    /\d{1,2}:\d{2}\s?(a\.?m\.?|p\.?m\.?)?/i
  );

  if (horaMatch) {
    result.data.hora = horaMatch[0];
  }

  const cuentaMatch = text.match(/\b\d{10,11}\b/);

  if (cuentaMatch) {
    result.data.destino = cuentaMatch[0];
  }

  const refMatch = text.match(/\b[A-Z]\d{6,8}\b/i);

  if (refMatch) {
    result.data.referencia = refMatch[0];
  }

  if (/bancolombia/i.test(text)) {
    result.data.banco = "BANCOLOMBIA";
  }

  if (/davivienda/i.test(text)) {
    result.data.banco = "DAVIVIENDA";
  }

  if (/nequi/i.test(text)) {
    result.data.banco = "NEQUI";
  }

  if (/bbva/i.test(text)) {
    result.data.banco = "BBVA";
  }

  return result;
}

module.exports = { parseBancoGenerico };