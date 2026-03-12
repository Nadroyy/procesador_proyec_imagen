function cleanText(text) {

  if (!text) return '';

  // eliminar caracteres de control
  text = text.replace(/[\x00-\x1F\x7F]/g, ' ');


  text = text
    .replace(/Ue\s*S/gi, '$')
    .replace(/S\s+(\d)/g, '$$$1')
    .replace(/O(?=\d)/g, '0')
    .replace(/l(?=\d)/g, '1');

  text = text

    // meses mal detectados
    .replace(/febreto/gi, 'febrero')
    .replace(/febreo/gi, 'febrero')

    // bancolombia
    .replace(/bancolar/gi, 'bancolombia')
    .replace(/ban\s?col/gi, 'bancolombia')
    .replace(/bancol0mbia/gi, 'bancolombia')

    // nequi
    .replace(/nequl/gi, 'nequi');

  // unir números separados por espacios
  text = text.replace(/(\d)\s+(?=\d)/g, '$1');

  text = text
    .replace(/\s+/g, ' ')
    .trim();

  return text;

}

module.exports = { cleanText };