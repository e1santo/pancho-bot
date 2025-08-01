const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.static('frontend')); // Sirve index.html desde /entrenarpancho
// Servir sólo las miniaturas de imágenes
app.use(
  '/uploads/images',
  express.static(path.join(__dirname, 'uploads', 'images'))
);

// (Opcional) bloquear acceso público a PDFs
// app.use('/uploads/pdfs', (req, res) => res.status(403).send('Prohibido'));

// Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Elegimos carpeta según tipo MIME
    const subfolder = file.mimetype.startsWith('image/') ? 'images' : 'pdfs';
    const uploadPath = path.join(__dirname, 'uploads', subfolder);

    // Creamos recursivamente si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Conserva nombre original
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Endpoint para recibir archivos
app.post('/upload', upload.array('files'), (req, res) => {
  res.json({ message: 'Archivos subidos correctamente' });
});

// Endpoint para listar archivos subidos
app.get('/archivos', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).send('Error leyendo archivos');
    res.json(files);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
