const path = require('path');
const { recognize: performOCR } = require('../services/ocrService');
const { parseAll } = require('../utils/parser');

exports.upload = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				estado: 'error',
				datos: null,
				confianza: 0,
				mensaje: 'No se subió ningún archivo'
			});
		}

		const filePath = path.resolve(req.file.path);

		// Validar existencia del archivo antes de procesar
		const fs = require('fs');
		if (!fs.existsSync(filePath)) {
			return res.status(400).json({
				estado: 'error',
				datos: null,
				confianza: 0,
				mensaje: 'Archivo no encontrado en el servidor'
			});
		}

		// Ejecutar OCR
		const { text, confidence } = await performOCR(filePath);

		// Parsear datos extraídos (estructura tipada)
		const parsed = parseAll(text || '');

		// Construir respuesta en español
		const response = {
			estado: 'exito',
			tipo: parsed.type || null,
			datos: parsed.data || {},
			confianza: confidence || 0,
			mensaje: ''
		};

		// Opción de descargar como JSON
		if (req.query.download === 'true') {
			res.setHeader('Content-Disposition', 'attachment; filename="pago-extraido.json"');
			res.setHeader('Content-Type', 'application/json');
			return res.send(JSON.stringify(response, null, 2));
		}

		return res.json(response);
	} catch (err) {
		console.error('Error en upload:', err.message || err);
		return res.status(500).json({
			estado: 'error',
			datos: null,
			confianza: 0,
			mensaje: err.message || 'Error interno'
		});
	}
};