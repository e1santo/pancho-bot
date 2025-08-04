// src/routes/reindex.js
import express from 'express'
import dotenv from 'dotenv'
import { pdfProcessor } from '../services/pdfProcessor.js'
import { buildEmbeddings } from '../utils/embeddings.js'
import { imageProcessor } from '../services/imageProcessor.js'
import { excelService } from '../services/excelService.js'
import { videoService } from '../services/videoService.js'



dotenv.config()
const router = express.Router()

// POST /api/reindex
// Este endpoint orquesta la reconstrucción de todos los manifests y embeddings
router.post('/', async (req, res) => {
  try {
    // 1) Procesar PDFs → knowledge.json
    await pdfProcessor()

    // 2) Procesar imágenes dentro de los PDFs → images.json
    await imageProcessor()

    // 3) Procesar Excel → products.json
    await excelService()

    // 4) Procesar videos → videos.json
    await videoService()

    // 5) Generar embeddings sobre los chunks recién creados
    await buildEmbeddings()

    return res.json({ status: 'ok', message: 'Reindex completado' })
  } catch (err) {
    console.error('Error en /api/reindex:', err)
    return res.status(500).json({ error: 'Fallo al reindexar' })
  }
})

export default router
