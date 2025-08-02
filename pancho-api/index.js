import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Manifests JSON
import knowledge from './knowledge.json'  assert { type: 'json' }
import products  from './products.json'   assert { type: 'json' }
import images    from './images.json'     assert { type: 'json' }
import videos    from './videos.json'     assert { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config()

// DEBUG: clave cargada
console.log('DEBUG 🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'OK' : 'No encontrada')

const app  = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Sirve miniaturas de imágenes
app.use(
  '/uploads/images',
  express.static(path.join(__dirname, 'uploads', 'images'))
)

// LLM y embeddings
const model = new ChatOpenAI({
  temperature: 0.7,
  modelName:  'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY
})
const embeddings = new OpenAIEmbeddings()

// Similitud coseno
function cosineSimilarity(a, b) {
  const dot  = a.reduce((s, ai, i) => s + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0))
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0))
  return magA && magB ? dot / (magA * magB) : 0
}

// Retrieval de knowledge.json
async function retrieveKnowledge(question, topK = 5) {
  const qVec = await embeddings.embedQuery(question)
  const sims = knowledge.map(item => ({
    ...item,
    score: cosineSimilarity(qVec, item.vector)
  }))
  return sims
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => `• [${item.source}] ${item.summary}`)
}

// Búsqueda de productos mejorada
function retrieveProducts(query) {
  const text = query.toLowerCase()

  return products
    .filter(p => {
      // 1) Coincidencia por tag
      const matchTag = (p.tags || []).some(tag =>
        text.includes(tag.toLowerCase())
      )
      // 2) Coincidencia por palabra del nombre
      const matchNameWord = p.name
        .toLowerCase()
        .split(/\s+/)
        .some(word => text.includes(word))

      return matchTag || matchNameWord
    })
    .slice(0, 5)
    .map(p => ({
      name:  p.name,
      url:   p.url,
      price: p.price
    }))
}

// Búsqueda de imágenes
function retrieveImages(query) {
  return images
    .filter(i =>
      i.filename.toLowerCase().includes(query) ||
      (i.tags || []).some(t => t.toLowerCase().includes(query))
    )
    .slice(0, 5)
    .map(i => `http://localhost:${port}/uploads/images/${i.filename}`)
}

// Búsqueda de videos
function retrieveVideos(query) {
  return videos
    .filter(v =>
      v.query.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map(v => v.url)
}

// Detección de intención básica
function detectIntent(text) {
  const t = text.toLowerCase()
  if (/\b(comprar|precio|recomiendas)\b/.test(t)) return 'product'
  if (/\b(video|tutorial|ver en video)\b/.test(t)) return 'video'
  // Ahora incluimos 'diagrama' como intención de imagen
  if (/\b(imagen|foto|ver esquema|diagrama)\b/.test(t)) return 'image'
  return 'chat'
}


// Prompt base
const systemPrompt = `
Actuás como *Pancho*, un electricista profesional argentino con más de 20 años de experiencia.
Responde de forma clara, amigable y profesional.
`

app.post('/api/pancho', async (req, res) => {
  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'Falta el mensaje del usuario' })

  const intent = detectIntent(message)

  // Respuesta estructurada
  const output = {
    text: '',
    products: [],
    images: [],
    videos: []
  }

  try {
    if (intent === 'product') {
      // Recomendar producto
      output.products = retrieveProducts(message)
      output.text = output.products.length
        ? `Te recomiendo estos productos:`
        : `No encontré productos relacionados.`
    } else if (intent === 'image') {
      // Mostrar imágenes
      output.images = retrieveImages(message)
      output.text = output.images.length
        ? `Te paso estas imágenes:`
        : `No encontré imágenes relacionadas.`
    } else if (intent === 'video') {
      // Enlazar videos
      output.videos = retrieveVideos(message)
      output.text = output.videos.length
        ? `Podría ayudarte con estos videos:`
        : `No encontré videos relacionados.`
    } else {
      // GPT-4 + retrieval de knowledge
      const chunks = await retrieveKnowledge(message, 5)
      const prompt = `
${systemPrompt}

He extraído esta información de mis manuales:
${chunks.join('\n')}

Usuario: ${message}
`
      const gptRes = await model.call([
        { role: 'system', content: prompt },
        { role: 'user',   content: message }
      ])
      output.text = gptRes.content
    }

    return res.json(output)

  } catch (err) {
    console.error('Error en /api/pancho:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Pancho API funcionando en http://localhost:${port}`)
})
