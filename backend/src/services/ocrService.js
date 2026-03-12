const fs = require('fs');
const os = require('os');
const path = require('path');

const { createWorker } = require('tesseract.js');
const { preprocessImage } = require('../utils/imagePreprocess');

const { detectReceiptType } = require('../utils/detector');
const { cleanText } = require('../utils/cleanText');

const { parseGeneric } = require('../utils/generic.parser');
const { parseNequi } = require('../utils/nequi.parser');
const { parseTransfer } = require('../utils/transfer.parser');
const { parseBreb } = require('../utils/breb.parser');
const { postprocess } = require('../utils/postprocess');

let worker = null;

async function getWorker() {
  if (!worker) {
    worker = await createWorker('spa', 1);

    await worker.setParameters({
      tessedit_pageseg_mode: 6
    });

    console.log("✅ OCR Worker iniciado");
  }

  return worker;
}


async function recognize(imagePath) {
  try {

    // 1️⃣ Obtener worker
    const ocrWorker = await getWorker();

    // 2️⃣ Preprocesar imagen
    const processedPath = await preprocessImage(imagePath);

    // 3️⃣ OCR imagen original
    const resultOriginal = await ocrWorker.recognize(imagePath);

    // 4️⃣ OCR imagen procesada
    const resultProcessed = await ocrWorker.recognize(processedPath);

    // 5️⃣ Elegir el mejor resultado
    const result =
      resultProcessed.data.confidence > resultOriginal.data.confidence
        ? resultProcessed
        : resultOriginal;

    // 6️⃣ Eliminar imagen temporal
    try {
      if (fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }
    } catch (e) {}

    const data = result?.data || {};
    const rawText = data.text || '';
    const text = cleanText(rawText);

    // 7️⃣ Detectar tipo de voucher
    const tipo = detectReceiptType(text);

    // 8️⃣ Parsear según tipo
    let parsed;

    switch (tipo) {
      case "NEQUI":
        parsed = parseNequi(text);
        break;

      case "TRANSFER":
        parsed = parseTransfer(text);
        break;

      case "BREB":
        parsed = parseBreb(text);
        break;

      default:
        parsed = parseGeneric(text);
    }

    let datos = parsed.data || {};

// aplicar postprocesamiento financiero
datos = postprocess(datos); 

    // 9️⃣ Calcular confianza
    let confidence = 0;

    if (data.words?.length) {
      const sum = data.words.reduce((s, w) => s + (w.confidence || 0), 0);
      confidence = Math.round(sum / data.words.length);
    } 
    else if (typeof data.confidence === 'number') {
      confidence = Math.round(data.confidence);
    }

    return { text, confidence, tipo, datos };

  } catch (error) {
    console.error('Error OCR:', error);
    throw new Error('No se pudo extraer texto de la imagen');
  }
}

module.exports = { recognize };