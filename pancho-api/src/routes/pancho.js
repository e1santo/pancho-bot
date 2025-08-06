// src/routes/pancho.js
import express from 'express'
import dotenv from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { queryEmbeddings } from '../utils/embeddings.js'
import { systemPrompt } from '../../../pancho-chatbot/src/systemPrompt.js'

dotenv.config()
const router = express.Router()

// Inicializamos el modelo
const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY
})

// Prompt base
//const systemPrompt = [ ].join("\n")



// POST /api/pancho

router.post('/', async (req, res) => {
  const { message } = req.body
  if (!message) {
    return res.status(400).json({ error: 'Falta el campo "message" en el body' })
  }

  try {
    // 1) recuperar los 5 chunks más relevantes
    const chunks = await queryEmbeddings(message, 5)

    // 2) armar prompt
    const prompt = `
${systemPrompt}

Información relevante extraída:
${chunks.map((c, i) => `${i+1}. ${c}`).join('\n')}

Usuario: ${message}
`

    // 3) llamar a GPT-4
    const response = await model.call([
      { role: 'system', content: prompt },
      { role: 'user',   content: message }
    ])

    // 4) devolver la respuesta
    return res.json({ reply: response.content })
  } catch (err) {
    console.error('Error en /api/pancho:', err)
    return res.status(500).json({ error: 'Error al procesar la consulta' })
  }
})

export default router
