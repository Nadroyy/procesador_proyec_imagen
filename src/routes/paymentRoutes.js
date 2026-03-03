const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const paymentController = require('../controllers/paymentController');

const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, unique + path.extname(file.originalname));
	}
});

function fileFilter(req, file, cb) {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true);
	} else {
		cb(new Error('Only jpg and png images are allowed'));
	}
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', upload.single('image'), paymentController.upload);

module.exports = router;