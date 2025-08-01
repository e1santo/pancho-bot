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
app.use('/uploads', express.static('uploads'));

// Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Conserva el nombre original
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
