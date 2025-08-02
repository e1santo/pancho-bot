import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// Servir archivos estáticos (formulario)
app.use(express.static(path.join(__dirname, '../public')))

// Configuración de Multer: carpeta temporal
const upload = multer({ dest: path.join(__dirname, '../uploads') })

// Ruta de carga: muestra el formulario
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Endpoint para recibir archivos
app.post('/upload', upload.fields([
  { name: 'pdfs',   maxCount: 5 },
  { name: 'images', maxCount: 20 },
  { name: 'videos', maxCount: 20 },
  { name: 'excel',  maxCount: 1 }
]), (req, res) => {
  // Por ahora, solo devolvemos lista de archivos subidos
  res.json({ files: req.files })
})

app.listen(PORT, () => {
  console.log(`🚀 Trainer server listening on http://localhost:${PORT}`)
})
