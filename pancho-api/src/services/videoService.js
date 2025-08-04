// src/services/videoService.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename   = fileURLToPath(import.meta.url)
const __dirname    = dirname(__filename)

// Ruta al manifest de trainer (donde pancho-trainer guarda los videos)
const TRAINER_MANIFEST = path.resolve(
  __dirname,
  '../../../pancho-trainer/src/manifests/videos.json'
)
// Ruta local en la API donde queremos copiar ese manifest
const API_MANIFEST     = path.resolve(
  __dirname,
  '../manifests/videos.json'
)

export async function videoService() {
  // 1) Lee el array de videos del trainer
  const raw = await fs.readFile(TRAINER_MANIFEST, 'utf-8')
  const arr = JSON.parse(raw || '[]')

  // 2) (Opcional) aquí podrías validar que cada objeto tenga { url, title, description, tags }

  // 3) Escribe ese mismo array en tu carpeta de manifests de la API
  await fs.writeFile(API_MANIFEST, JSON.stringify(arr, null, 2), 'utf-8')
  console.log(`✅ videoService: generado ${arr.length} videos en videos.json`)
}
