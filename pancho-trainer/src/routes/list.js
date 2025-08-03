// pancho-trainer/src/routes/list.js

import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const router = express.Router()

// Listar archivos subidos por tipo: /api/files/:type
// type puede ser 'pdfs', 'images' o 'excel'
router.get('/:type', async (req, res) => {
  const type = req.params.type
  const dir  = path.join(__dirname, '../../uploads', type)
  try {
    const files = await fs.readdir(dir)
    res.json({ files })
  } catch (e) {
    res.status(500).json({ error: `No se pudo leer la carpeta ${type}` })
  }
})

// Borrar un archivo específico: DELETE /api/files/:type/:filename
router.delete('/:type/:filename', async (req, res) => {
  const { type, filename } = req.params
  const filePath = path.join(__dirname, '../../uploads', type, filename)
  try {
    await fs.unlink(filePath)
    res.json({ deleted: filename })
  } catch (e) {
    res.status(500).json({ error: `No se pudo borrar ${filename}` })
  }
})

export default router
