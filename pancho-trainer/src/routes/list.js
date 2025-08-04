import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const router     = express.Router()

// Mapear tipo a carpeta (trainer/uploads) y manifest correspondiente
const folders = {
  pdfs:   'pdfs',
  images: 'images',
  videos: 'videos',
  excel:  'excel'
}
const manifests = {
  pdfs:   path.join(__dirname, '../manifests/knowledge.json'),
  images: path.join(__dirname, '../manifests/images.json'),
  videos: path.join(__dirname, '../manifests/videos.json'),
  excel:  path.join(__dirname, '../manifests/products.json')
}

// GET /api/files/:type
// Devuelve el array completo de objetos según el manifest
router.get('/:type', async (req, res) => {
  const type = req.params.type
  const mpath = manifests[type]
  if (!mpath) return res.status(404).json({ files: [] })

  try {
    const raw = await fs.readFile(mpath, 'utf-8')
    const arr = JSON.parse(raw || '[]')
    return res.json({ files: arr })
  } catch (e) {
    console.error(`Error leyendo manifest ${type}:`, e)
    return res.status(500).json({ files: [] })
  }
})

// DELETE /api/files/:type/:index
// Borra el elemento en la posición `index` del manifest (y el archivo físico si aplica)
router.delete('/:type/:index', async (req, res) => {
  const { type, index } = req.params
  const idx = Number(index)
  const manifestPath = manifests[type]
  if (!manifestPath) return res.status(404).json({ error: 'Tipo no válido' })

  try {
    const arr = JSON.parse(await fs.readFile(manifestPath, 'utf-8') || '[]')

    // Para videos solo actualizamos manifest
    if (type === 'videos') {
      const removed = arr.splice(idx, 1)
      await fs.writeFile(manifestPath, JSON.stringify(arr, null, 2), 'utf-8')
      return res.json({ deleted: removed[0] })
    }

    // Para los demás, además de manifest borramos el archivo
    const folder = folders[type]
    const fileEntry = arr[idx]
    const filename = (type === 'pdfs') ? fileEntry.source : fileEntry.filename

    // eliminar archivo físico
    await fs.unlink(path.join(__dirname, '../../uploads', folder, filename))

    // quitar del manifest
    arr.splice(idx, 1)
    await fs.writeFile(manifestPath, JSON.stringify(arr, null, 2), 'utf-8')

    return res.json({ deleted: filename })
  } catch (e) {
    console.error(`Error borrando ${type}/${index}:`, e)
    return res.status(500).json({ error: e.message })
  }
})

export default router
