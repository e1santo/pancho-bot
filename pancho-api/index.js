import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { ChatOpenAI } from '@langchain/openai'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import embeddingsIndex from './embeddings.json' assert { type: 'json' };
import { cosineSimilarity } from 'langchain/dist/util/math'; // para calcular similitud

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
// --- Recuperar chunks relevantes ---
async function retrieveRelevantChunks(question, topK = 5) {
  // 1) Embed la pregunta
  const queryVec = await new OpenAIEmbeddings().embedQuery(question);

  // 2) Calcular similitudes
  const sims = embeddingsIndex.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.vector)
  }));

  // 3) Ordenar de mayor a menor y tomar topK
  const top = sims
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // 4) Retornar solo el texto de los chunks
  return top.map(item => `[${item.source}] ${item.chunk}`);
}


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
    console.error('Error al generar respuesta:', err);
    console.error(
      'Detalle completo del error:',
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    res.status(500).json({ error: 'Error al generar respuesta' });
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
    const retrievedChunks = await retrieveRelevantChunks(message, 5)
    const promptConArchivos = `
${systemPrompt}

📂 Contexto relevante extraído de documentos:
${retrievedChunks.join('\n\n')}
    `

    const response = await model.call([
      { role: 'system', content: promptConArchivos },
      { role: 'user', content: message }
    ])

    res.json({ reply: response.content })
  } catch (err) {
    // ...
  }
})

app.listen(3000, '0.0.0.0', () => {
  console.log(`🚀 Pancho API funcionando en http://localhost:${port}`)
})
