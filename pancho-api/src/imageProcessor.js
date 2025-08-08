import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execP = promisify(exec)
const PDF_DIR    = path.join(process.cwd(), 'uploads', 'pdfs')
const OUT_IMG_DIR = path.join(process.cwd(), 'uploads', 'images')

export async function imageProcessor() {
  await fs.mkdir(OUT_IMG_DIR, { recursive: true })
  const manifest = []
  const files = await fs.readdir(PDF_DIR)

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.pdf')) continue

    const pdfPath  = path.join(PDF_DIR, file)
    const baseName = path.basename(file, '.pdf')
    const prefix   = path.join(OUT_IMG_DIR, baseName)

    // 1) Leer el listado y construir el mapa index→page
    let listOut
    try {
      const { stdout } = await execP(`pdfimages -list "${pdfPath}"`)
      listOut = stdout.split('\n').slice(2)  // saltamos encabezados
    } catch (err) {
      console.error(`No pude listar imágenes de ${file}:`, err)
      continue
    }
    // parseamos líneas con columnas separadas por espacios
    const indexToPage = {}
    for (const line of listOut) {
      const cols = line.trim().split(/\s+/)
      if (cols.length >= 2) {
        const pageNum = parseInt(cols[0], 10)
        const imgIdx  = parseInt(cols[1], 10)
        if (!isNaN(pageNum) && !isNaN(imgIdx)) {
          indexToPage[imgIdx] = pageNum
        }
      }
    }

    // 2) Extraer las imágenes
    try {
      await execP(`pdfimages -png "${pdfPath}" "${prefix}"`)
    } catch (err) {
      console.error(`Error extrayendo imágenes de ${file}:`, err)
      continue
    }

    // 3) Recopilar los PNG y poblar manifest con la página correspondiente
    const imgs = (await fs.readdir(OUT_IMG_DIR))
      .filter(name =>
        name.startsWith(baseName) &&
        name.toLowerCase().endsWith('.png')
      )

    for (const imgName of imgs) {
      // pngs vienen como baseName-NNN.png
      const idx = parseInt(imgName.match(/-(\d+)\.png$/)?.[1], 10)
      const page = indexToPage[idx] ?? null

      manifest.push({
        pdf:      file,
        imagePath: path.join(OUT_IMG_DIR, imgName),
        page,                       // aquí tienes la página de origen
        imageUrl: `/images/${imgName}`
      })
    }
  }

  // 4) Guardar el manifest
  await fs.writeFile(
    path.join(process.cwd(), 'uploads', 'images.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log('✔️ imageProcessor: generado', manifest.length, 'entradas en images.json')
}

