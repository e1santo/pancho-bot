// src/services/videoService.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Carpeta donde pancho-trainer guarda los enlaces de video
const VIDEOS_DIR     = path.resolve(__dirname, '../../../pancho-trainer/uploads/videos')
// Manifiesto destino
const VIDEOS_MANIFEST = path.resolve(__dirname, '../manifests/videos.json')

export async function videoService() {
  try {
    const manifest = []
    const files = await fs.readdir(VIDEOS_DIR)
    console.log('🎬 videoService encontró:', files)

    for (const file of files) {
      // Cada archivo lo trataremos como JSON con metadata
      const data = JSON.parse(await fs.readFile(path.join(VIDEOS_DIR, file), 'utf-8'))
      // Esperamos algo como { filename, title, description, tags, videos:[url,...] }
      // Ajusta según tu esquema real
      manifest.push({
        id:          data.filename,
        title:       data.title,
        description: data.description,
        tags:        data.tags || [],
        urls:        data.videos  || []
      })
    }

    await fs.writeFile(VIDEOS_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`✅ videoService: generado ${manifest.length} videos en videos.json`)
  } catch (err) {
    console.error('❌ videoService error:', err)
    throw err
  }
}
