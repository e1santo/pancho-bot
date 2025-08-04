// src/services/pdfProcessor.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Usamos directamente pdf-parse en su versión “pura”
const PDF_PARSE_PATH = 'pdf-parse/lib/pdf-parse.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Ajusta según dónde clones pancho-trainer
const TRAINER_PDFS_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/pdfs')
const KNOWLEDGE_JSON   = path.resolve(__dirname, '../manifests/knowledge.json')

/**
 * Corta un texto en trozos de tamaño maxLen con solapamiento overlap
 */
function chunkText(text, maxLen = 1000, overlap = 200) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(text.length, start + maxLen)
    chunks.push(text.slice(start, end).trim())
    start += maxLen - overlap
  }
  return chunks
}

/**
 * Extrae texto de PDF pero lo divide en “páginas” usando regex sobre
 * el texto plano (buscando “Página X” u otras marcas).
 */
export async function pdfProcessor() {
  try {
    // import dinámico para saltarnos el test de ejemplo
    const { default: pdfParse } = await import(PDF_PARSE_PATH)

    const files = await fs.readdir(TRAINER_PDFS_DIR)
    const knowledge = []

    for (const file of files) {
      if (!file.toLowerCase().endsWith('.pdf')) continue
      const filePath = path.join(TRAINER_PDFS_DIR, file)
      const data = await fs.readFile(filePath)
      const { text: rawText } = await pdfParse(data)

      // 1) Dividir en “páginas” buscando marcas como “Página 4”, “PÁGINA 10”, etc.
      //    Usamos lookahead para no perder el marcador
      const pages = rawText.split(/(?=Página\s*\d+)/i)

      pages.forEach((pageText, idx) => {
        const pageNum = idx + 1
        // 2) Limpiar espacios
        const cleaned = pageText.replace(/\s+/g, ' ').trim()
        // 3) Chunkear
        const chunks = chunkText(cleaned, 1000, 200)
        // 4) Añadir a manifest
        for (const chunk of chunks) {
          knowledge.push({ source: file, page: pageNum, chunk })
        }
      })
    }

    // 5) Escribir manifest
    await fs.writeFile(KNOWLEDGE_JSON, JSON.stringify(knowledge, null, 2), 'utf-8')
    console.log(`✅ pdfProcessor: generado ${knowledge.length} chunks en knowledge.json`)
  } catch (err) {
    console.error('❌ pdfProcessor error:', err)
    throw err
  }
}


