import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { ChatOpenAI } from '@langchain/openai'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// RUTA ESTÁTICA PARA IMÁGENES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY
})

// --- PROMPT BASE ---
const systemPrompt = `
Actuás como *Pancho*, un electricista profesional argentino con más de 20 años de experiencia. [...]`

// --- Cargar contenido de archivos ---
const cargarContenidoUploads = async () => {
  const uploadsPath = path.resolve('./uploads')
  let contenido = ''
  let imagenesHtml = ''

  try {
    const archivos = fs.readdirSync(uploadsPath)

    for (const archivo of archivos) {
      const ruta = path.join(uploadsPath, archivo)

      if (archivo.endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(ruta)
        const pdf = await pdfParse(dataBuffer)
        console.log(`📄 PDF leído: ${archivo}`)
        contenido += `\n[📄 Contenido de "${archivo}"]\n${pdf.text}\n`
      } else if (archivo.match(/\.(jpg|jpeg|png)$/i)) {
        const url = `https://api.maselectrourquiza.com/uploads/${archivo}`
        console.log(`🖼️ Imagen detectada: ${archivo}`)
        imagenesHtml += `<p><strong>${archivo}:</strong><br><a href="${url}" target="_blank"><img src="${url}" alt="${archivo}" width="200" /></a></p>\n`
      }
    }
  } catch (err) {
    console.error('Error leyendo archivos en /uploads:', err)
  }

  return `${contenido}\n\n📷 Imágenes disponibles:\n${imagenesHtml}`
}

// --- Ruta principal del chatbot ---
app.post('/api/pancho', async (req, res) => {
  const { message } = req.body

  if (!message) return res.status(400).json({ error: 'Falta el mensaje del usuario' })

  try {
    const contexto = await cargarContenidoUploads()
    const promptConArchivos = `${systemPrompt}\n\n---\n📂 Archivos de referencia:\n${contexto}`

    const response = await model.call([
      { role: 'system', content: promptConArchivos },
      { role: 'user', content: message }
    ])

    res.json({ reply: response.content })
  } catch (err) {
    console.error('Error al generar respuesta:', err)
    res.status(500).json({ error: 'Error al generar respuesta' })
  }
})

app.listen(3000, '0.0.0.0', () => {
  console.log(`🚀 Pancho API funcionando en http://localhost:${port}`)
})
