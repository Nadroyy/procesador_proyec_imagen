require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Garantizar que la carpeta de uploads exista al iniciar
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
	console.log('Creada carpeta uploads:', uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

app.use('/api', paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

module.exports = app;