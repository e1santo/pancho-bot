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
// DEBUG: verificar que cargó la clave
console.log('DEBUG 🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'OK' : 'No encontrada');


const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Servir sólo miniaturas de imágenes
app.use(
  '/uploads/images',
  express.static(path.join(__dirname, 'uploads', 'images'))
);

// (Opcional) bloquear acceso público a PDFs
// app.use('/uploads/pdfs', (req, res) => res.status(403).send('Prohibido'));


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
  const pdfDir = path.join(__dirname, 'uploads', 'pdfs');
  const imgDir = path.join(__dirname, 'uploads', 'images');

  let contenido = '';
  let imagenesHtml = '';

  // 1) Leer PDFs
  try {
    const pdfFiles = await fs.promises.readdir(pdfDir);
    for (const file of pdfFiles) {
      if (file.endsWith('.pdf')) {
        const dataBuffer = await fs.promises.readFile(path.join(pdfDir, file));
        const parsed = await pdfParse(dataBuffer);
        console.log(`📄 PDF leído: ${file}`);
        contenido += `\n[📄 Contenido de "${file}"]\n${parsed.text}\n`;
      }
    }
 } catch (err) {
    // Línea existente, déjala:
    console.error('Error al generar respuesta:', err);
    // Líneas nuevas, añádelas justo después:
    console.error('Detalle completo del error:', JSON.stringify(
      err,
      Object.getOwnPropertyNames(err),
      2
    ));
    res.status(500).json({ error: 'Error al generar respuesta' })
  }

  // 2) Leer imágenes
  try {
    const imgFiles = await fs.promises.readdir(imgDir);
    for (const file of imgFiles) {
      if (file.match(/\.(jpg|jpeg|png)$/i)) {
        const url = `https://api.maselectrourquiza.com/uploads/images/${file}`;
        console.log(`🖼️ Imagen detectada: ${file}`);
        imagenesHtml += `<p><strong>${file}:</strong><br><a href="${url}" target="_blank"><img src="${url}" alt="${file}" width="200" /></a></p>\n`;
      }
    }
  } catch (err) {
    console.error('Error leyendo imágenes en uploads/images:', err);
  }

  return `${contenido}\n\n📷 Imágenes disponibles:\n${imagenesHtml}`;
};


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
