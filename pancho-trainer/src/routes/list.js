// src/routes/list.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const router     = express.Router()
// Mapear carpetas
const folders = {
  pdfs:   'pdfs',
  images: 'images',
  videos: 'videos',
  excel:  'excel'
}
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


  // Borrar (y sincronizar manifest)
router.delete('/:type/:filename', async (req, res) => {
  const { type, filename } = req.params
  const folder = folders[type] || ''
  const manifestPath = manifests[type]

  try {
    // 1) Si es video, NO borramos archivo físico, solo manifest
    if (type === 'videos') {
      const arr = JSON.parse(await fs.readFile(manifestPath, 'utf-8') || '[]')
      const clean = arr.filter(item => item.url !== filename)
      await fs.writeFile(manifestPath, JSON.stringify(clean, null, 2), 'utf-8')
      return res.json({ deleted: filename })
    }

    // 2) Para los demás tipos, borramos archivo físico…
    const filePath = path.join(__dirname, '../../uploads', folder, filename)
    await fs.unlink(filePath)

    // …y luego limpiamos el manifest correspondiente
    if (manifestPath) {
      const arr = JSON.parse(await fs.readFile(manifestPath, 'utf-8') || '[]')
      const clean = arr.filter(item => {
        if (type === 'images') return item.filename !== filename
        if (type === 'pdfs')   return item.source   !== filename
        if (type === 'excel')  return item.filename !== filename
        return true
      })
      await fs.writeFile(manifestPath, JSON.stringify(clean, null, 2), 'utf-8')
    }

    return res.json({ deleted: filename })
  } catch (e) {
    console.error(`Error borrando ${type}/${filename}:`, e)
    return res.status(500).json({ error: e.message })
  }
})

export default router
