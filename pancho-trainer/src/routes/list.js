// src/routes/list.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const router     = express.Router()

// Mapear tipo a manifest
const manifests = {
  pdfs:   path.join(__dirname, '../manifests/knowledge.json'),
  images: path.join(__dirname, '../manifests/images.json'),
  videos: path.join(__dirname, '../manifests/videos.json'),
  excel:  path.join(__dirname, '../manifests/products.json')
}

// GET /api/files/:type
// Devuelve la lista de objetos del manifest con toda la metadata
router.get('/:type', async (req, res) => {
  const type = req.params.type
  const mpath = manifests[type]
  if (!mpath) {
    return res.status(404).json({ files: [] })
  }

  try {
    const raw = await fs.readFile(mpath, 'utf-8')
    const arr = JSON.parse(raw || '[]')
    return res.json({ files: arr })
  } catch (e) {
    console.error(`Error leyendo manifest ${type}:`, e)
    return res.status(500).json({ files: [] })
  }
})

// DELETE /api/files/:type/:filename
// Elimina el fichero y sincroniza el manifest
router.delete('/:type/:filename', async (req, res) => {
  const { type, filename } = req.params
  const uploadsDir = path.join(__dirname, '../../uploads', type)

  try {
    // 1) Eliminar fichero físico
    await fs.unlink(path.join(uploadsDir, filename))

    // 2) Actualizar manifest
    const mpath = manifests[type]
    if (mpath) {
      const raw = await fs.readFile(mpath, 'utf-8')
      const arr = JSON.parse(raw || '[]')
      const filtered = arr.filter(item => {
        // Para imágenes
        if (type === 'images') return item.filename !== filename
        // Para PDFs
        if (type === 'pdfs')   return item.source   !== filename
        // Para videos
        if (type === 'videos') return item.url      !== filename
        // Para Excel/catalog
        if (type === 'excel')  return item.filename !== filename
        return true
      })
      await fs.writeFile(mpath, JSON.stringify(filtered, null, 2))
    }

    return res.json({ deleted: filename })
  } catch (e) {
    console.error(`Error borrando ${type}/${filename}:`, e)
    return res.status(500).json({ error: e.message })
  }
})

export default router
