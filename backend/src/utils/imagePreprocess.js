const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Preprocesa una imagen para optimizarla para OCR.
 * - Convierte a escala de grises
 * - Normaliza el contraste
 * - Aplica sharpen para definir bordes
 * - Guarda como PNG (formato sin pérdida)
 * @param {string} inputPath - Ruta de la imagen original
 * @returns {Promise<string>} - Ruta de la imagen procesada
 */
async function preprocessImage(inputPath) {
  const outputPath = inputPath.replace(
    /\.(jpg|jpeg|png)$/i,
    '_processed.png'
  );

await sharp(inputPath)
  .grayscale()
  .modulate({ brightness: 1.1 })
  .sharpen(0.5)
  .png()
  .toFile(outputPath);

  return outputPath;
}

module.exports = { preprocessImage };