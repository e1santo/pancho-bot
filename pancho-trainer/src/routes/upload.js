// src/routes/upload.js
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const router     = express.Router()

// Manifests
const manifest = {
  pdfs:    path.join(__dirname, '../manifests/knowledge.json'),
  images:  path.join(__dirname, '../manifests/images.json'),
  videos:  path.join(__dirname, '../manifests/videos.json'),
  excel:   path.join(__dirname, '../manifests/products.json')
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    let sub = 'others'
    if (ext === '.pdf') sub = 'pdfs'
    else if (['.png', '.jpg', '.jpeg'].includes(ext)) sub = 'images'
    else if (['.xlsx', '.csv'].includes(ext)) sub = 'excel'
    cb(null, path.join(__dirname, '../../uploads', sub))
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}_${file.originalname}`
    cb(null, name)
  }
})
const upload = multer({ storage })

// Solo procesamos archivos para pdfs/images/excel
const fieldsMiddleware = upload.fields([
  { name: 'pdfs', maxCount: 5 },
  { name: 'images', maxCount: 20 },
  { name: 'excel', maxCount: 1 }
])

router.post('/', fieldsMiddleware, async (req, res) => {
  try {
    // Normalizo req.files para evitar undefined
    const files = req.files || {}

    // 1) Videos (vienen en req.body.videos, no hay archivo físico)
    if (req.body.videos) {
      const vids = JSON.parse(await fs.readFile(manifest.videos, 'utf-8') || '[]')
      for (const url of req.body.videos.split(',').map(u => u.trim()).filter(Boolean)) {
        if (!vids.some(v => v.url === url)) {
          vids.push({
            url,
            title:       req.body.title || '',
            description: req.body.description || '',
            tags:        (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean)
          })
        }
      }
      await fs.writeFile(manifest.videos, JSON.stringify(vids, null, 2), 'utf-8')
    }

    // 2) PDFs
    if (Array.isArray(files.pdfs)) {
      const arr = JSON.parse(await fs.readFile(manifest.pdfs, 'utf-8') || '[]')
      for (const f of files.pdfs) {
        if (!arr.some(x => x.source === f.filename)) {
          arr.push({ source: f.filename })
        }
      }
      await fs.writeFile(manifest.pdfs, JSON.stringify(arr, null, 2), 'utf-8')
    }

    // 3) Imágenes
    if (Array.isArray(files.images)) {
      const imgs = JSON.parse(await fs.readFile(manifest.images, 'utf-8') || '[]')
      for (const f of files.images) {
        if (!imgs.some(x => x.filename === f.filename)) {
          imgs.push({
            filename:    f.filename,
            title:       req.body.title       || '',
            description: req.body.description || '',
            tags:        (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean),
            sourcePdf:   '',
            page:        null
          })
        }
      }
      await fs.writeFile(manifest.images, JSON.stringify(imgs, null, 2), 'utf-8')
    }

    // 4) Excel/CSV
    if (Array.isArray(files.excel)) {
      const ex = JSON.parse(await fs.readFile(manifest.excel, 'utf-8') || '[]')
      for (const f of files.excel) {
        if (!ex.some(x => x.filename === f.filename)) {
          ex.push({ filename: f.filename })
        }
      }
      await fs.writeFile(manifest.excel, JSON.stringify(ex, null, 2), 'utf-8')
    }

    // 5) Redirigir de vuelta al formulario para recargar lista
    res.redirect('/')
  } catch (err) {
    console.error('Error en /api/upload:', err)
    res.status(500).json({ error: 'Error procesando subida' })
  }
})

export default router

