// pancho-trainer/src/server.js
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import uploadRouter from './routes/upload.js'
import listRouter   from './routes/list.js'
import metaRouter   from './routes/metadata.js'

dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// Servir HTML/CSS/JS estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Montar routers
app.use('/upload', uploadRouter)
app.use('/files',  listRouter)
app.use('/meta',   metaRouter)

app.listen(PORT, () => {
  console.log(`🚀 Trainer running at http://localhost:${PORT}`)
})
