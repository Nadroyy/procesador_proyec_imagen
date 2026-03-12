function extraerCuenta(text) {

  const candidatos = text.match(/\d{10,12}/g);

  if (!candidatos) return null;

  for (const numero of candidatos) {

    // ignorar números demasiado largos (IDs)
    if (numero.length > 11) continue;

    // validar que empiece como cuentas comunes
    if (!numero.startsWith('497') &&
        !numero.startsWith('820') &&
        !numero.startsWith('790')) {
      continue;
    }

    const cuenta =
      numero.slice(0,3) +
      "-" +
      numero.slice(3,9) +
      "-" +
      numero.slice(9,11);

    return cuenta;
  }

  return null;
}

module.exports = { extraerCuenta };