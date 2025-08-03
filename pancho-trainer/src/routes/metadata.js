// pancho-trainer/src/routes/metadata.js

import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const router = express.Router()

// Mapa de tipos a rutas de manifests JSON
const manifestFiles = {
  images:    path.join(__dirname, '../manifests/images.json'),
  videos:    path.join(__dirname, '../manifests/videos.json'),
  pdfs:      path.join(__dirname, '../manifests/knowledge.json'),
  excel:     path.join(__dirname, '../manifests/products.json')
}

// GET metadata de un ítem
// :type = images|videos|pdfs|excel
// :id   = filename (images/pdfs) o URL (videos) o source (pdfs)
router.get('/:type/:id', async (req, res) => {
  const { type, id } = req.params
  const manifestPath = manifestFiles[type]
  if (!manifestPath) return res.status(400).json({ error: 'Tipo no soportado' })

  try {
    const data = await fs.readFile(manifestPath, 'utf-8')
    const items = JSON.parse(data)
    const item = items.find(x => {
      if (type === 'images' || type === 'pdfs') {
        return x.filename === id
      } else if (type === 'videos') {
        return x.url === id
      } else if (type === 'excel') {
        return x.id === id
      }
    })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json({ metadata: item })
  } catch (e) {
    res.status(500).json({ error: 'Error leyendo metadata' })
  }
})

// PUT actualizar metadata de un ítem
router.put('/:type/:id', express.json(), async (req, res) => {
  const { type, id } = req.params
  const { title, description, tags } = req.body
  const manifestPath = manifestFiles[type]
  if (!manifestPath) return res.status(400).json({ error: 'Tipo no soportado' })

  try {
    const raw   = await fs.readFile(manifestPath, 'utf-8')
    const items = JSON.parse(raw)
    const idx   = items.findIndex(x => {
      if (type === 'images' || type === 'pdfs') {
        return x.filename === id
      } else if (type === 'videos') {
        return x.url === id
      } else if (type === 'excel') {
        return x.id === id
      }
    })
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' })

    // Actualizar campos permitidos
    if (title !== undefined)       items[idx].title       = title
    if (description !== undefined) items[idx].description = description
    if (tags !== undefined)        items[idx].tags        = tags

    await fs.writeFile(manifestPath, JSON.stringify(items, null, 2))
    res.json({ updated: items[idx] })
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando metadata' })
  }
})

export default router
