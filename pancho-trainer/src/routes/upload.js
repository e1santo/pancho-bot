import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const router = express.Router()

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
    if (ext === '.pdf')            sub = 'pdfs'
    else if (['.png','.jpg','.jpeg'].includes(ext)) sub = 'images'
    else if (ext === '.xlsx' || ext === '.csv')    sub = 'excel'
    cb(null, path.join(__dirname, '../../uploads', sub))
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}_${file.originalname}`
    cb(null, name)
  }
})
const upload = multer({ storage })

// Fields config
const fields = upload.fields([
  { name:'pdfs', maxCount:5 },
  { name:'images', maxCount:20 },
  { name:'excel', maxCount:1 }
])

router.post('/', fields, async (req, res) => {
  try {
    // 1) Videos (no files, vienen en req.body.videos)
    if (req.body.videos) {
      const vids = JSON.parse(await fs.readFile(manifest.videos, 'utf-8') || '[]')
      for (const url of req.body.videos.split(',').map(u=>u.trim()).filter(Boolean)) {
        if (!vids.some(v=>v.url===url)) {
          vids.push({
            url,
            title:       req.body.title || '',
            description: req.body.description || '',
            tags:        (req.body.tags||'').split(',').map(t=>t.trim()).filter(Boolean)
          })
        }
      }
      await fs.writeFile(manifest.videos, JSON.stringify(vids,null,2))
    }

    // 2) PDFs
    if (Array.isArray(req.files.pdfs)) {
      const arr = JSON.parse(await fs.readFile(manifest.pdfs, 'utf-8')||'[]')
      for (const f of req.files.pdfs) {
        if (!arr.some(x=>x.source===f.filename)) {
          arr.push({ source:f.filename })
        }
      }
      await fs.writeFile(manifest.pdfs, JSON.stringify(arr,null,2))
    }

    // 3) Imágenes
    if (Array.isArray(req.files.images)) {
      const imgs = JSON.parse(await fs.readFile(manifest.images, 'utf-8')||'[]')
      for (const f of req.files.images) {
        if (!imgs.some(x=>x.filename===f.filename)) {
          imgs.push({
            filename:    f.filename,
            title:       req.body.title  || '',
            description: req.body.description || '',
            tags:        (req.body.tags||'').split(',').map(t=>t.trim()).filter(Boolean),
            sourcePdf:   '',
            page:        null
          })
        }
      }
      await fs.writeFile(manifest.images, JSON.stringify(imgs,null,2))
    }

    // 4) Excel
    if (Array.isArray(req.files.excel)) {
      const ex = JSON.parse(await fs.readFile(manifest.excel,'utf-8')||'[]')
      for (const f of req.files.excel) {
        if (!ex.some(x=>x.filename===f.filename)) {
          ex.push({ filename:f.filename })
        }
      }
      await fs.writeFile(manifest.excel, JSON.stringify(ex,null,2))
    }

    // … tras escribir los manifests …
// redirige al usuario de vuelta al index
res.redirect('/')

  } catch (err) {
    console.error('Error en /api/upload:', err)
    res.status(500).json({ error:'Error procesando subida' })
  }
})

export default router
