const path = require('path');
const fs = require('fs');

const { recognize } = require('../services/ocrService');

exports.upload = async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'No se subió ningún archivo'
      });
    }

    const filePath = path.resolve(req.file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'Archivo no encontrado'
      });
    }

    const { text, confidence, tipo, datos } =
      await recognize(filePath);

    const monto = datos?.monto || null;
    const fecha = datos?.fecha || null;

    const referencia = datos?.referencia || null;

    const destino =
      datos?.destino ||
      datos?.cuenta ||
      null;

    const banco =
      datos?.banco ||
      tipo ||
      null;

    const response = {

      estado: "exito",

      monto,
      fecha,
      banco,

      referencia,
      destino,

      confianza: confidence || 0

    };

    return res.json(response);

  } catch (err) {

    console.error("Error en upload:", err);

    return res.status(500).json({
      estado: "error",
      mensaje: err.message || "Error interno"
    });

  }

};