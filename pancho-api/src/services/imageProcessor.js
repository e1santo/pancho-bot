// src/services/imageProcessor.js
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directorios
const PDF_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/pdfs')
const OUT_IMG_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/images')
const IMAGES_MANIFEST = path.resolve(__dirname, '../manifests/images.json')

export async function imageProcessor() {
  // 0) Limpieza de imágenes huérfanas
  const pdfFiles = await fs.readdir(PDF_DIR)
  const pdfBaseNames = new Set(pdfFiles.map(f => path.basename(f, '.pdf').toLowerCase()))

  await fs.mkdir(OUT_IMG_DIR, { recursive: true })
  const imgFiles = await fs.readdir(OUT_IMG_DIR)

  for (const img of imgFiles) {
    // asumimos nombre como `<baseName>_page-<n>.png`
    const match = img.match(/^(.+?)_page/i)
    if (match) {
      const base = match[1].toLowerCase()
      if (!pdfBaseNames.has(base)) {
        // borrar imagen huérfana
        await fs.unlink(path.join(OUT_IMG_DIR, img))
        console.log(`🗑️  Imagen huérfana eliminada: ${img}`)
      }
    }
  }

  // 1) Procesamiento normal
  const manifest = []
  const files = await fs.readdir(PDF_DIR)
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.pdf')) continue

    const pdfPath = path.join(PDF_DIR, file)
    const baseName = path.basename(file, '.pdf')
    const prefix = path.join(OUT_IMG_DIR, `${baseName}_page`)

    // Extraer imágenes
    try {
      await execAsync(`/usr/bin/pdfimages -png "${pdfPath}" "${prefix}"`)
    } catch (err) {
      console.error(`Error extrayendo imágenes de ${file}:`, err)
      continue
    }

    // Leer imágenes generadas para este PDF
    const imgs = (await fs.readdir(OUT_IMG_DIR))
      .filter(name =>
        name.startsWith(`${baseName}_page`) &&
        name.toLowerCase().endsWith('.png')
      )

    // Añadirlas al manifest
    for (const imgName of imgs) {
      const match = imgName.match(/_page-?(\d+)\.png$/i)
      const page = match ? Number(match[1]) : null
      manifest.push({
        filename: imgName,
        sourcePdf: file,
        page,
        title: '',
        description: '',
        tags: []
      })
    }
  }

  // Guardar manifest
  await fs.writeFile(IMAGES_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`✅ imageProcessor: generado ${manifest.length} entradas en images.json`)
}

