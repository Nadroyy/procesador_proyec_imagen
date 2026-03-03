const fs = require('fs');
const os = require('os');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

async function extractText(imagePath) {
  try {
    const tmpDir = os.tmpdir();
    const processedPath = path.join(tmpDir, `proc-${Date.now()}${path.extname(imagePath)}`);

    await sharp(imagePath)
      .rotate()
      .greyscale()
      .normalize()
      .sharpen()
      .median(1)
      .threshold(140)   
      .resize({ width: 1800 })
      .toFile(processedPath);

    const result = await Tesseract.recognize(processedPath, 'spa', {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,: $/-áéíóúñ'
    });

    // Limpieza del temporal
    try { if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath); } catch (e) {}

    const data = result?.data || {};
    const text = data.text || '';

    let confidence = 0;
    if (data.words?.length) {
      const sum = data.words.reduce((s, w) => s + (w.confidence || 0), 0);
      confidence = Math.round(sum / data.words.length);
    } else if (typeof data.confidence === 'number') {
      confidence = Math.round(data.confidence);
    }

    return { text, confidence };
  } catch (error) {
    console.error('Error en OCR:', error.message || error);
    throw new Error('No se pudo extraer texto de la imagen');
  }
}

module.exports = { recognize: extractText, extractText };