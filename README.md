# API Procesador de Comprobantes de Pago

API REST que extrae información de comprobantes digitales (Nequi, Daviplata, etc.) usando OCR y procesamiento de texto con expresiones regulares.

## 🚀 Características

- ✅ Carga de imágenes (JPG/PNG, máximo 5MB)
- ✅ Extracción de texto con OCR (Tesseract.js, idioma español)
- ✅ Parseo inteligente de datos:
  - **Monto** (en pesos colombianos)
  - **Fecha** (formato DD/MM/AAAA)
  - **Referencia** (número o código de transacción)
  - **Pagador** (nombre de quien envía)
  - **Plataforma** (Nequi, Daviplata, Bancolombia, etc.)
- ✅ Confianza de OCR (porcentaje)
- ✅ Manejo de errores robusto
- ✅ Logs detallados del procesamiento

## 📋 Requisitos

- Node.js v14+
- npm

## 🔧 Instalación

```bash
# 1. Clonar o descargar el proyecto
cd mi-procesador-pagos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional)
# Crear archivo .env en la raíz (ya existe con PORT=3000)
```

## 📝 Configuración

Archivo `.env`:
```
PORT=3000
```

## 🏃 Ejecución

### Modo producción
```bash
npm start
```

### Modo desarrollo (con auto-reinicio)
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000` por defecto.

## 📡 API Endpoint

### POST `/api/upload`

Sube una imagen de comprobante para procesar.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@/ruta/a/comprobante.jpg"
```

**Body:** 
- Campo: `image` (multipart/form-data)
- Tipo: JPG o PNG
- Tamaño máximo: 5MB

**Response:**
```json
{
  "status": "success",
  "data": {
    "amount": 50000,
    "date": "18/02/2026",
    "reference": "ABC123456",
    "payer": "Juan Pérez",
    "platform": "Nequi"
  },
  "confidence": 85,
  "message": ""
}
```

**Response (con error):**
```json
{
  "status": "error",
  "data": null,
  "confidence": 0,
  "message": "No file uploaded"
}
```

## 📊 Campos de respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | `"success"` o `"error"` |
| `data.amount` | number \| null | Monto en pesos (ej: 50000) |
| `data.date` | string \| null | Fecha en formato DD/MM/AAAA |
| `data.reference` | string \| null | Número de referencia/transacción |
| `data.payer` | string \| null | Nombre del pagador |
| `data.platform` | string \| null | Plataforma detectada |
| `confidence` | number | Confianza del OCR (0-100%) |
| `message` | string | Mensaje de error (si aplica) |

## 🏗️ Arquitectura

```
src/
├── app.js                          # Servidor Express principal
├── controllers/
│   └── paymentController.js        # Controlador del endpoint
├── routes/
│   └── paymentRoutes.js            # Definición de rutas
├── services/
│   └── ocrService.js               # Servicio de OCR (Tesseract)
└── utils/
    └── parser.js                   # Funciones de parseo de texto
```

### Flujo de procesamiento

1. **Route** (paymentRoutes.js) → recibe POST con imagen
2. **Multer** → valida y almacena archivo en `uploads/`
3. **Controller** (paymentController.js) → orquesta el flujo
4. **OCR Service** (ocrService.js) → extrae texto de la imagen
5. **Parser** (parser.js) → extrae campos específicos con regex
6. **Response** → retorna JSON con la información

## 🔍 Patrones de búsqueda

El parser busca información usando expresiones regulares adaptadas a comprobantes colombianos:

### Monto
- Busca líneas con palabras clave: "monto", "valor", "total", "$"
- Soporta formatos: `50000`, `50,000`, `50.000`, `$50,000`

### Fecha
- Formatos: `DD/MM/AAAA`, `DD-MM-AAAA`, `DD.MM.AAAA`
- Ejemplo: `18/02/2026`

### Referencia
- Búsqueda de palabras clave: "ref", "referencia", "código", "txn"
- Fallback: números de 6+ dígitos

### Pagador
- Búsqueda de: "pagador", "de", "remitente", "ordenante", "enviado por"

### Plataforma
- Detecta: Nequi, Daviplata, Bancolombia, Davivienda, Movii, Efecty

## 📁 Estructura de archivos

```
mi-procesador-pagos/
├── .env
├── package.json
├── README.md
├── src/
│   ├── app.js
│   ├── controllers/
│   │   └── paymentController.js
│   ├── routes/
│   │   └── paymentRoutes.js
│   ├── services/
│   │   └── ocrService.js
│   └── utils/
│       └── parser.js
├── uploads/                        # Imágenes subidas (se crean automáticamente)
└── node_modules/
```

## 🧪 Pruebas

### Con curl
```bash
# Asegúrate de que el servidor está corriendo en otra terminal
# En una carpeta con una imagen llamada imagen.jpg:
curl -X POST http://localhost:3000/api/upload -F "image=@imagen.jpg"
```

### Con Node.js (test-upload.js)
```bash
node test-upload.js
```

### Prueba del parser
```bash
node test-parser.js
```

## 🛠️ Dependencias principales

- **express** (4.18.2) - Framework web
- **multer** (1.4.5) - Manejo de uploads
- **tesseract.js** (5.0.4) - OCR
- **cors** (2.8.5) - CORS middleware
- **dotenv** (16.4.7) - Variables de entorno

## 📝 Logs

El servidor imprime información útil en consola:

```
Server started on port 3000

Received upload request
File saved to C:\...\uploads\1771429495577-567690475.jpg
Starting OCR for: C:\...\uploads\1771429495577-567690475.jpg

===== TEXTO OCR EXTRAÍDO =====
NEQUI
Referencia: 123456789
Fecha: 18/02/2026
...
==============================

OCR completed. Text length: 294 Confidence: 83
🔥 PARSER NUEVO EJECUTÁNDOSE 🔥
```

## ⚙️ Configuración avanzada

### Variables de entorno adicionales (extendible)
```env
PORT=3000
# LOG_LEVEL=debug
# OCR_LANG=spa,eng
```

### Limites de archivo
En `src/routes/paymentRoutes.js`:
```javascript
limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
```

### Formatos aceptados
En `src/routes/paymentRoutes.js`:
```javascript
if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
  // válido
}
```

## 🐛 Solución de problemas

### "No file uploaded"
- Verifica que el campo del formulario se llama `image`
- Asegúrate de que el archivo existe y es accesible

### Error de regex "Range out of order"
- Revisa que los rangos en clases de caracteres estén bien ordenados
- El guión `-` debe estar al inicio o final de la clase: `[a-z-]` o `[-az]`

### OCR devuelve texto vacío
- La imagen puede ser muy pequeña, pixelada o de mala calidad
- Intenta con una imagen de mayor resolución

### "worker.terminate is not a function"
- Asegúrate de usar la API correcta de tesseract.js (v5.0+)
- No uses `createWorker` sin las funciones apropiadas

## 🚀 Mejoras futuras

- [ ] Almacenamiento de resultados en base de datos
- [ ] Validación de montos para detectar anomalías
- [ ] Soporte para más plataformas de pago
- [ ] Machine learning para mejorar precisión
- [ ] API de estadísticas de procesamiento
- [ ] Descarga de historial de comprobantes
- [ ] WebSocket para uploads en tiempo real

## 📄 Licencia

ISC

## 👨‍💻 Autor

Generado con asistencia de IA

---

**Estado actual:** ✅ Funcional  
**Última actualización:** 18 de febrero de 2026
