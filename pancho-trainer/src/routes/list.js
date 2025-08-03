import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const router     = express.Router()

// Mapear tipo a carpeta y manifest correspondiente
const folders = { pdfs:'pdfs', images:'images', excel:'excel' }
const manifests = {
  pdfs: path.join(__dirname, '../manifests/knowledge.json'),
  images: path.join(__dirname, '../manifests/images.json'),
  excel:  path.join(__dirname, '../manifests/products.json')
}

// Listar
router.get('/:type', async (req, res) => {
  const type = req.params.type
  const dir  = path.join(__dirname, '../../uploads', folders[type]||'')
  try {
    const files = await fs.readdir(dir)
    res.json({ files })
  } catch {
    res.status(404).json({ files:[] })
  }
})

// Borrar + sincronizar manifest
router.delete('/:type/:filename', async (req, res) => {
  const { type, filename } = req.params
  const dir = path.join(__dirname, '../../uploads', folders[type]||'')
  try {
    // 1) eliminar fichero
    await fs.unlink(path.join(dir, filename))

    // 2) actualizar JSON
    const mpath = manifests[type]
    if (mpath) {
      const arr = JSON.parse(await fs.readFile(mpath, 'utf-8'))
      const clean = arr.filter(item => {
        if (type==='images') return item.filename !== filename
        if (type==='pdfs')   return item.source   !== filename
        if (type==='excel')  return item.id       !== filename
      })
      await fs.writeFile(mpath, JSON.stringify(clean, null, 2))
    }

    res.json({ deleted: filename })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
