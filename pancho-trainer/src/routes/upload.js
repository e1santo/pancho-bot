// pancho-trainer/src/routes/upload.js
import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Clasificar según extensión
    const ext = path.extname(file.originalname).toLowerCase()
    let sub = 'others'
    if (ext === '.pdf')       sub = 'pdfs'
    else if (['.png','.jpg','.jpeg'].includes(ext)) sub = 'images'
    else if (['.xlsx','.csv'].includes(ext))         sub = 'excel'
    cb(null, path.join(__dirname, '../../uploads', sub))
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname)
  }
})
const upload = multer({ storage })

// Campos: pdfs[], images[], excel[], videos (texto)
router.post('/', upload.fields([
  { name: 'pdfs',   maxCount: 5 },
  { name: 'images', maxCount: 20 },
  { name: 'excel',  maxCount: 1 }
]), (req, res) => {
  // Videos vienen en body.videos como texto con comas
  const videoLinks = req.body.videos
    ? req.body.videos.split(',').map(u=>u.trim()).filter(Boolean)
    : []

  // Prepara lista de archivos subidos
  const files = {
    pdfs:   req.files.pdfs   || [],
    images: req.files.images || [],
    excel:  req.files.excel  || [],
    videos: videoLinks
  }
  res.json({ files })
})

export default router
