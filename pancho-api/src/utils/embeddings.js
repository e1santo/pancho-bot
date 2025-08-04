// src/utils/embeddings.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { OpenAIEmbeddings } from '@langchain/openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Rutas de los manifests
const KNOWLEDGE_JSON   = path.resolve(__dirname, '../manifests/knowledge.json')
const EMBEDDINGS_JSON  = path.resolve(__dirname, '../manifests/embeddings.json')

// Inicializamos el generador de embeddings
const embedder = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY
})

/**
 * Construye embeddings para todos los chunks de knowledge.json
 * y los guarda en embeddings.json con su metadato.
 */
export async function buildEmbeddings() {
  try {
    // 1) Leemos los chunks generados por pdfProcessor
    const knowledgeRaw = await fs.readFile(KNOWLEDGE_JSON, 'utf-8')
    const knowledge = JSON.parse(knowledgeRaw)  // array de { source, page, chunk }

    // 2) Extraemos solo los textos
    const texts = knowledge.map(item => item.chunk)

    // 3) Generamos embeddings
    console.log(`🔑 Generando embeddings para ${texts.length} chunks...`)
    const vectors = await embedder.embedDocuments(texts)

    // 4) Combinamos vectores con metadatos
    const embeddings = knowledge.map((item, idx) => ({
      source: item.source,
      page:   item.page,
      chunk:  item.chunk,
      vector: vectors[idx]
    }))

    // 5) Guardamos en JSON
    await fs.writeFile(EMBEDDINGS_JSON, JSON.stringify(embeddings, null, 2), 'utf-8')
    console.log(`✅ buildEmbeddings: guardado ${embeddings.length} embeddings en ${EMBEDDINGS_JSON}`)
  } catch (err) {
    console.error('❌ buildEmbeddings error:', err)
    throw err
  }
}

/**
 * Dada una pregunta, busca los topK chunks más similares
 * usando similitud coseno sobre los embeddings precalculados.
 * Retorna un array de strings formateados.
 */
export async function queryEmbeddings(question, topK = 5) {
  // Carga dinámica de cosineSimilarity
  const { cosineSimilarity } = await import('@stdlib/math-base-special-cosine-similarity')
    .catch(() => {
      // fallback manual
      return {
        cosineSimilarity: (a, b) => {
          let dot = 0, magA = 0, magB = 0
          for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i]
            magA += a[i] * a[i]
            magB += b[i] * b[i]
          }
          return magA && magB ? dot / Math.sqrt(magA * magB) / Math.sqrt(magB) : 0
        }
      }
    })

  // 1) Generamos embedding de la pregunta
  const queryVec = await embedder.embedQuery(question)

  // 2) Leemos todos los embeddings precalculados
  const raw = await fs.readFile(EMBEDDINGS_JSON, 'utf-8')
  const items = JSON.parse(raw)  // array de { source, page, chunk, vector }

  // 3) Calculamos similitud
  const sims = items.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.vector)
  }))

  // 4) Ordenamos y tomamos topK
  sims.sort((a, b) => b.score - a.score)
  const top = sims.slice(0, topK)

  // 5) Devolvemos solo los strings (puedes formatear con fuente y página)
  return top.map(item =>
    `(${item.source} – pág. ${item.page}) ${item.chunk}`
  )
}
