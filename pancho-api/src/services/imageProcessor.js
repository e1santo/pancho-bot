// src/services/imageProcessor.js
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directorio de PDFs subidos por pancho-trainer
const PDF_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/pdfs')
// Directorio donde guardamos las imágenes extraídas
const OUT_IMG_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/images')
// Manifest a generar
const IMAGES_MANIFEST = path.resolve(__dirname, '../manifests/images.json')

export async function imageProcessor() {
  // Aseguramos que exista el directorio de salida
  await fs.mkdir(OUT_IMG_DIR, { recursive: true })

  const manifest = []
  const files = await fs.readdir(PDF_DIR)
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.pdf')) continue
    const pdfPath = path.join(PDF_DIR, file)
    const baseName = path.basename(file, '.pdf')
    const prefix = path.join(OUT_IMG_DIR, `${baseName}_page`)

    // Extraer imágenes con pdfimages
    try {
      await execAsync(`pdfimages -png "${pdfPath}" "${prefix}"`)
    } catch (err) {
      console.error(`Error extrayendo imágenes de ${file}:`, err)
      continue
    }

    // Leer todas las imágenes extraídas para este PDF
    const imgs = await fs.readdir(OUT_IMG_DIR)
    for (const imgFile of imgs) {
      if (!imgFile.startsWith(`${baseName}_page`)) continue
      // Determinar número de página (buscando dígitos tras _page)
      const match = imgFile.match(/_page-?(\d+)\.png$/i)
      const page = match ? Number(match[1]) : null

      manifest.push({
        filename: imgFile,
        sourcePdf: file,
        page,
        title: '',
        description: '',
        tags: []
      })
    }
  }

  // Guardar manifest a disco
  await fs.writeFile(IMAGES_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`✅ imageProcessor: generado ${manifest.length} entradas en images.json`)
}
